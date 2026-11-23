import { useState, useEffect, useCallback } from 'react';
import TicketItem from './TicketItem.jsx';
import { evaluateTicket } from "../utils/prize.js";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import {
  fetchTickets,
  deleteTicket,
  purchaseTickets,
} from '../api.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'Активные' },
  { value: 'winner', label: 'Выигрышные' },
  { value: 'expired', label: 'Истёкшие' },
];

const PAGE_SIZE = 10;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function TicketList({ tickets: initialTicketsProp } = {}) {
  const providedTickets = Array.isArray(initialTicketsProp) ? initialTicketsProp : null;
  const [tickets, setTickets] = useState(providedTickets || []);
  const useServerMode = !providedTickets;
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(currentUser ? currentUser.email : '');
  const [cartQuantity, setCartQuantity] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadPage = useCallback(
    async (nextOffset, replace, signal) => {
      try {
        if (replace) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        const params = { limit: PAGE_SIZE, offset: nextOffset };
        if (filterStatus !== 'all') params.status = filterStatus;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const data = await fetchTickets(params, signal);
        const list = Array.isArray(data) ? data : [];

        setTickets((prev) => (replace ? list : [...prev, ...list]));
        setHasMore(list.length === PAGE_SIZE);
        setOffset(nextOffset + list.length);
      } catch (err) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError' || /cancel/i.test(err?.message || '')) return;
        setError(err.message || 'Ошибка загрузки данных');
        throw err;
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filterStatus, searchQuery]
  );

  useEffect(() => {
    if (!useServerMode) return;
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      let attempt = 0;
      while (attempt < 3 && !cancelled) {
        try {
          await loadPage(0, true, controller.signal);
          break;
        } catch (err) {
          if (controller.signal.aborted || /cancel/i.test(err?.message || '')) break;
          attempt += 1;
          if (attempt < 3) await sleep(500 * attempt);
          else setError(err?.message || 'Не удалось загрузить данные');
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filterStatus, searchQuery, retryCount, loadPage]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const controller = new AbortController();
    loadPage(offset, false, controller.signal).catch(() => {});
  };

  const handleOpenCheckout = () => {
    setFirstName(currentUser ? currentUser.firstName || '' : '');
    setLastName(currentUser ? currentUser.lastName || '' : '');
    setEmail(currentUser ? currentUser.email : '');
    setIsCheckoutOpen(true);
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setCheckoutError('');
    setError('');
  };

  const handleConfirmPurchase = async () => {
    const owner = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!owner) {
      setCheckoutError('Укажите имя и фамилию');
      return;
    }
    if (!email) {
      setCheckoutError('Укажите E-mail');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setCheckoutError('Введите корректный E-mail (например, ivanov@gmail.com)');
      return;
    }
    try {
      await purchaseTickets({ owner, email, quantity: cartQuantity });
      setIsCheckoutOpen(false);
      setCheckoutError('');
      setFirstName('');
      setLastName('');
      setCartQuantity(1);
      await loadPage(0, true, null);
    } catch (err) {
      setCheckoutError(err.message || 'Не удалось оформить покупку');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот билет?')) return;
    const index = tickets.findIndex((t) => t.id === id);
    const backup = index >= 0 ? tickets[index] : null;

    setTickets((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTicket(id);
    } catch (err) {
      if (backup) {
        setTickets((prev) => {
          const copy = [...prev];
          const insertAt = Math.min(index, copy.length);
          copy.splice(insertAt, 0, backup);
          return copy;
        });
      }
      setError(err.message || 'Не удалось удалить билет');
    }
  };

  const handleUpdate = async (updated) => {
    const evaluated = evaluateTicket(updated.numbers, updated.purchaseDate);
    const normalized = { ...updated, status: evaluated.status, prizeAmount: evaluated.prizeAmount };
    const previous = tickets.find((t) => t.id === updated.id);
    setTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...normalized, _pending: true } : t))
    );
    setEditingId(null);

    try {
      const saved = await updateTicket(normalized.id, {
        owner: normalized.owner,
        numbers: normalized.numbers,
        status: normalized.status,
        prizeAmount: normalized.prizeAmount,
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? saved : t))
      );
    } catch (err) {
      if (previous) {
        setTickets((prev) =>
          prev.map((t) => (t.id === updated.id ? previous : t))
        );
      }
      setError(err.message || 'Не удалось обновить билет');
    }
  };

  const editingTicket = editingId != null ? tickets.find((t) => t.id === editingId) : null;


  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-left">
          <button className="btn-create" type="button" onClick={handleOpenCheckout}>
            Создать билет
          </button>
        </div>
        <div className="top-right">
          {currentUser ? (
            <button
              type="button"
              className="secondary"
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
            >
              🚪 Выход ({currentUser.role === 'admin' ? 'Админ' : 'Пользователь'})
            </button>
          ) : (
            <button
              type="button"
              className="secondary"
              onClick={() => navigate('/login', { replace: true })}
            >
              🔑 Войти
            </button>
          )}
        </div>
      </header>

      {editingTicket && (
        <TicketForm
          initialData={editingTicket}
          onUpdate={handleUpdate}
          onCancelEdit={() => setEditingId(null)}
        />
      )}

      {error && (
        <div className="msg msg-error" style={{ margin: '12px 0' }}>
          {error}
          <button
            type="button"
            className="secondary"
            style={{ marginLeft: 12 }}
            onClick={handleRetry}
          >
            Повторить
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Загрузка билетов…</div>
      ) : (
        <div className="content">
          <div className="list-wrap">
            <ul className="tickets">
              {tickets.length === 0 ? (
                <li className="empty">Билетов не найдено.</li>
              ) : (
                tickets.map((ticket) => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    onDelete={handleDelete}
                    onEdit={(t) => setEditingId(t.id)}
                  />
                ))
              )}
            </ul>
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Загрузка…' : 'Загрузить ещё'}
                </button>
              </div>
            )}
          </div>
          <div className="filter-wrap">
            <p className="filter-label">Фильтр</p>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              className="filter-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Поиск по владельцу"
            />
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {checkoutError && (
              <div className="modal-error">{checkoutError}</div>
            )}
            <h2>Оформление покупки</h2>
            <div className="modal-fields">
              <div className="modal-field">
                <label>Имя</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Иван"
                  required
                />
              </div>
              <div className="modal-field">
                <label>Фамилия</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Иванов"
                  required
                />
              </div>
              <div className="modal-field">
                <label>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ivanov@gmail.com"
                  required
                />
              </div>
              <div className="modal-field">
                <label>Количество билетов</label>
                <div className="cart-qty-controls">
                  <button
                    type="button"
                    className="cart-qty-btn"
                    onClick={() => setCartQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <input
                    className="cart-qty"
                    type="number"
                    min="1"
                    value={cartQuantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1) setCartQuantity(v);
                    }}
                  />
                  <button
                    type="button"
                    className="cart-qty-btn"
                    onClick={() => setCartQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-summary">
              <p><strong>Владелец:</strong> {`${firstName} ${lastName}`.trim() || '—'}</p>
              <p><strong>E-mail:</strong> {email || '—'}</p>
              <p><strong>Стоимость за билет:</strong> 5 BYN</p>
              <p><strong>Итого:</strong> {cartQuantity * 5} BYN</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={handleCloseCheckout}>
                Отмена
              </button>
              <button type="button" className="btn-create" onClick={handleConfirmPurchase}>
                Оплатить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
