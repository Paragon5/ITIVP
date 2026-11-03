import { useState, useEffect, useCallback } from 'react';
import TicketItem from './TicketItem.jsx';
import TicketForm from './TicketForm.jsx';
import { generateTicket } from "../utils/randomTicket.js";
import { evaluateTicket } from "../utils/prize.js";
import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import {
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
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

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Автозаполнение имени и фамилии из профиля пользователя
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
    }
  }, [currentUser]);

  // Debounce поиска
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

  // Загрузка при смене фильтров/поиска с повторными попытками
  useEffect(() => {
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

  const handleAdd = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    const owner = `${firstName.trim()} ${lastName.trim()}`;
    const ticket = generateTicket();
    ticket.owner = owner;
    const evaluated = evaluateTicket(ticket.numbers, ticket.purchaseDate);
    ticket.status = evaluated.status;
    ticket.prizeAmount = evaluated.prizeAmount;
    const tempId = ticket.id;

    // Оптимистичное добавление
    setTickets((prev) => [{ ...ticket, _pending: true }, ...prev]);
    setFirstName('');
    setLastName('');

    try {
      const created = await createTicket({
        owner,
        numbers: ticket.numbers,
        prizeAmount: ticket.prizeAmount,
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === tempId ? created : t))
      );
    } catch (err) {
      setTickets((prev) => prev.filter((t) => t.id !== tempId));
      setError(err.message || 'Не удалось добавить билет');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот билет?')) return;
    const index = tickets.findIndex((t) => t.id === id);
    const backup = index >= 0 ? tickets[index] : null;

    // Оптимистичное удаление
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
          <button className="btn-create" type="button" onClick={handleAdd}>
            Создать билет
          </button>
          <input
            className="input-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Имя"
            maxLength="30"
          />
          <input
            className="input-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Фамилия"
            maxLength="30"
          />
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
    </div>
  );
}
