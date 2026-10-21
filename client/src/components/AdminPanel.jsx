import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import TicketItem from './TicketItem.jsx';
import TicketList from './TicketList.jsx';
import { useAuth } from '../hooks/useAuth.js';


export default function AdminPanel() {
  const { currentUser } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();

  const [userTickets, setUserTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('tickets_storage'));
      const all = stored || [];
      const distinctUsers = [];
      const seen = new Set();

      for (const ticket of all) {
        if (!seen.has(ticket.owner)) {
          seen.add(ticket.owner);
          distinctUsers.push(ticket.owner);
        }
      }

      setUsers(distinctUsers.map((name) => ({ name, count: 1 })));
      setLoadingUsers(false);
      setLoadingTickets(false);

      if (userId) {
        loadTicketsForUser(userId);
      }
    } catch (err) {
      setError('Некорректные данные в localStorage');
      setLoadingUsers(false);
      setLoadingTickets(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && userTickets.length === 0) {
      loadTicketsForUser(userId);
    }
  }, [userId]);

  const loadTicketsForUser = (name) => {
    const stored = JSON.parse(localStorage.getItem('tickets_storage'));
    const all = stored || [];
    const tickets = all.filter((t) => t.owner === name);
    setUserTickets(tickets);
    setLoadingTickets(false);
  };

  const handleUserClick = (name) => {
    navigate(`/admin/${encodeURIComponent(name)}`);
  };

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">⚙</span>
          <span>Админка</span>
        </div>
        <div className="auth-area">
          <span className="role-badge admin">Админ</span>
          <span className="text-dim">{currentUser?.name || ''}</span>
        </div>
      </header>

      <main className="app-main">
        <div className="flex flex-column items-center gap-12">
          <nav className="flex flex-wrap gap-12" style={{ width: '100%', maxWidth: 900 }}>
            <Link to="/admin" className="btn primary">
              Все билеты
            </Link>
            <Link to="/admin/all" className="btn">
              Билеты пользователя
            </Link>
          </nav>

          {loadingUsers ? (
            <div className="flex items-center gap-8">
              <div className="spinner" />
              <span className="text-dim">Загрузка пользователей…</span>
            </div>
          ) : error ? (
            <div className="empty">{error}</div>
          ) : (
            <div className="user-list">
              {users.map((user) => (
                <div
                  key={user.name}
                  className="user-card"
                  onClick={() => handleUserClick(user.name)}
                >
                  <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-ticket-count">{user.count} билетов</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {userId && (
          <div className="ticket-detail">
            <h3>Билеты пользователя «{userId}»</h3>

            {loadingTickets ? (
              <div className="flex items-center gap-8">
                <div className="spinner" />
                <span className="text-dim">Загрузка билетов…</span>
              </div>
            ) : userTickets.length === 0 ? (
              <p className="empty">У этого пользователя пока нет билетов.</p>
            ) : (
              <TicketList tickets={userTickets} view="admin-user" />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
