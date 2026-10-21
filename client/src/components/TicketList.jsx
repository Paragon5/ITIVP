import { useState, useEffect, useRef } from 'react';
import TicketItem from './TicketItem.jsx';
import TicketForm from './TicketForm.jsx';
import { INITIAL_TICKETS, TICKETS_STORAGE_KEY } from '../data/initialTickets.js';
import { generateTicket } from '../utils/randomTicket.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'winner', label: 'Выигрышные' },
  { value: 'expired', label: 'Истёкшие' },
];

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'По дате (новые)' },
  { value: 'date-asc', label: 'По дате (старые)' },
  { value: 'prize-desc', label: 'По призу (высокий)' },
  { value: 'owner-asc', label: 'По владельцу (А–Я)' },
];

const MIN_PRIZE = 5;
const MID_PRIZE = 100;
const MAX_PRIZE = 10000;

function randomPrizeAmount() {
  const r = Math.random() * 100;
  if (r < 2) return MAX_PRIZE;
  if (r < 10) return MID_PRIZE;
  if (r < 25) return MIN_PRIZE;
  return 0;
}

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [owner, setOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);
  const isLoaded = useRef(false); // данные уже загружены из localStorage

  // Эффект 1: загрузка из localStorage при монтировании (+ имитация загрузки 1 с)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : null;
        if (Array.isArray(data) && data.length > 0) {
          setTickets(data);
        } else {
          setTickets(INITIAL_TICKETS);
          // Сохраняем начальные данные, если хранилище было пустым
          if (!raw) {
            localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
          }
        }
      } catch {
        setTickets(INITIAL_TICKETS);
      } finally {
        setLoading(false);
        isLoaded.current = true;
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Эффект 2: автосохранение в localStorage с debounce 500 мс
  useEffect(() => {
    // Не сохраняем пустой начальный статус до завершения загрузки,
    // иначе перезапишем существующие данные в localStorage пустым массивом
    if (!isLoaded.current && tickets.length === 0) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } catch (err) {
        console.error('Ошибка сохранения в localStorage:', err);
      }
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [tickets, isLoaded]);

  // Эффект 3: изменение заголовка страницы в зависимости от количества билетов
  useEffect(() => {
    const total = tickets.length;
    document.title = total > 0 ? `Лотерейные билеты (${total})` : 'Лотерейные билеты';
  }, [tickets]);

  const total = tickets.length;
  const winners = tickets.filter((t) => t.status === 'winner').length;
  const active = tickets.filter((t) => t.status === 'active').length;
  const expired = tickets.filter((t) => t.status === 'expired').length;
  const totalPrize = tickets.reduce((sum, t) => sum + (Number(t.prizeAmount) || 0), 0);

  let displayed = tickets.filter((t) => filterStatus === 'all' || t.status === filterStatus);
  displayed = [...displayed].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.purchaseDate) - new Date(a.purchaseDate);
    if (sortBy === 'date-asc') return new Date(a.purchaseDate) - new Date(b.purchaseDate);
    if (sortBy === 'prize-desc') return (Number(b.prizeAmount) || 0) - (Number(a.prizeAmount) || 0);
    if (sortBy === 'owner-asc') return (a.owner || '').localeCompare(b.owner || '');
    return 0;
  });

  const handleAdd = (event) => {
    event.preventDefault();
    if (!owner.trim()) return;
    const ticket = generateTicket(randomPrizeAmount());
    ticket.owner = owner.trim();
    setTickets([ticket, ...tickets]);
    setOwner('');
  };

  const handleDelete = (id) => {
    if (!window.confirm('Удалить этот билет?')) return;
    setTickets(tickets.filter((t) => t.id !== id));
  };

  const handleEdit = (ticket) => setEditingId(ticket.id);
  const handleUpdate = (updated) => {
    setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
    setEditingId(null);
  };
  const handleCancelEdit = () => setEditingId(null);
  const isEditing = (id) => editingId === id;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Лотерейные билеты</h1>
        <p className="subtitle">
          Создание, фильтрация, сортировка и хранение в localStorage
        </p>
      </header>

      {loading ? (
        <div className="loading">Загрузка билетов с сервера…</div>
      ) : (
        <>
          <div className="stats">
            <span><strong>Всего:</strong> {total}</span>
            <span><strong>Выигрышных:</strong> {winners}</span>
            <span><strong>Активных:</strong> {active}</span>
            <span><strong>Истёкших:</strong> {expired}</span>
            <span><strong>Общая сумма призов:</strong> {totalPrize.toLocaleString('ru-RU')} Br</span>
          </div>

          <div className="create-panel">
            <h2>Создать билет</h2>
            <p className="create-hint">
              Введите только ФИО владельца. Числа, дата, статус и сумма приза определяются автоматически.
            </p>
            <form className="create-controls" onSubmit={handleAdd}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.9rem', fontWeight: 600 }}>
                Владелец (Имя Фамилия)
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Иванов Иван"
                  required
                />
              </label>
              <button type="submit">Создать билет</button>
            </form>
          </div>

          <div className="controls">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="saved-indicator">{saved ? 'Сохранено в localStorage' : ''}</span>
          </div>

          <ul className="tickets">
            {displayed.length === 0 ? (
              <li className="empty">Билетов не найдено.</li>
            ) : (
              displayed.map((ticket) => (
                <TicketItem
                  key={ticket.id}
                  ticket={ticket}
                  canManage
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </ul>

          {editingId && (
            <TicketForm
              key={editingId}
              initialData={tickets.find((t) => t.id === editingId)}
              onUpdate={handleUpdate}
              onCancelEdit={handleCancelEdit}
            />
          )}
        </>
      )}
    </div>
  );
}
