import { useState, useEffect, useRef } from 'react';
import TicketItem from './TicketItem.jsx';
import { INITIAL_TICKETS, TICKETS_STORAGE_KEY } from '../data/initialTickets.js';
import { generateTicket } from '../utils/randomTicket.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'Активные' },
  { value: 'winner', label: 'Выигрышные' },
  { value: 'expired', label: 'Истёкшие' },
];

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = uselocalStorage.getItem(TICKETS_STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : null;
        if (Array.isArray(data) && data.length > 0) {
          setTickets(data);
        } else {
          setTickets(INITIAL_TICKETS);
          if (!raw) {
            uselocalStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(INITIAL_TICKETS));
          }
        }
      } catch {
        setTickets(INITIAL_TICKETS);
      } finally {
        setLoading(false);
        isLoaded.current = true;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
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


  useEffect(() => {
    document.title = tickets.length > 0
      ? `Лотерейные билеты (${tickets.length})`
      : 'Лотерейные билеты';
  }, [tickets]);

  let displayed = tickets.filter((t) => {
    const byStatus = filterStatus === 'all' || t.status === filterStatus;
    const bySearch = t.owner.toLowerCase().includes(search.toLowerCase());
    return byStatus && bySearch;
  });
  displayed = [...displayed].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

  const handleAdd = () => {
    if (!firstName.trim() || !lastName.trim()) return;
    const ticket = generateTicket(0);
    ticket.owner = `${firstName.trim()} ${lastName.trim()}`;
    setTickets([ticket, ...tickets]);
    setFirstName('');
    setLastName('');
  };

  const handleDelete = (id) => {
    if (!window.confirm('Удалить этот билет?')) return;
    setTickets(tickets.filter((t) => t.id !== id));
  };

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-left">
          <button className="btn-create" type="button" onClick={handleAdd}>
            Создать билет
          </button>
        </div>
        <div className="top-right">
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
      </header>

      {loading ? (
        <div className="loading">Загрузка билетов…</div>
      ) : (
        <div className="content">
          <div className="list-wrap">
            <ul className="tickets">
              {displayed.length === 0 ? (
                <li className="empty">Билетов не найдено.</li>
              ) : (
                displayed.map((ticket) => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </ul>
          </div>
          <div className="filter-wrap">
            <p className="filter-label">Фильтр</p>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              className="filter-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по владельцу"
            />
            {saved && <span className="saved">Сохранено</span>}
          </div>
        </div>
      )}
    </div>
  );
}
