import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { purchaseTickets } from '../api.js';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const { currentUser } = useAuth();

  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');

  // Если перешли из списка билетов — просто меняем статус на оплачен
  useEffect(() => {
    if (ticketId) {
      fetch(`/tickets/${ticketId}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(async res => {
        if (res.ok) {
          setPaid(true);
        } else {
          setError('Ошибка оплаты');
        }
      }).catch(err => {
        setError('Ошибка связи с сервером');
      });
    }
  }, [ticketId]);

  const formattedDate = purchaseDate.toLocaleString('ru-RU');

  if (paid) {
    return (
      <div className="app-wrapper">
        <div className="payment-page">
          <div className="payment-card">
            <h2>Оплата прошла успешно</h2>
            <p><strong>Билет оплачен</strong></p>
            <button className="btn-secondary" onClick={() => navigate('/')}>Вернуться к билетам</button>
          </div>
        </div>
      </div>
    );
  }

  // Остальная форма покупки...
  const count = Math.max(1, parseInt(searchParams.get('count') || '1', 10));
  const pricePerTicket = 5;
  const totalPrice = pricePerTicket * count;

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">🎫</span>
          <span>Оплата билета</span>
        </div>
        <div className="auth-area">
          {currentUser && (
            <>
              <span className={`role-badge ${currentUser.role === 'admin' ? 'admin' : 'user'}`}>
                {currentUser.role === 'admin' ? 'Админ' : 'Пользователь'}
              </span>
              <button
                type="button"
                className="secondary"
                onClick={() => navigate('/', { replace: true })}
              >
                К билетам
              </button>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="payment-page">
          <div className="payment-card">
            <h2>Оформление покупки</h2>
            <p><strong>Владелец:</strong> {currentUser ? currentUser.email : 'Гость'}</p>
            <p><strong>Количество билетов:</strong> {count}</p>
            <p><strong>Дата покупки:</strong> {formattedDate}</p>
            <p><strong>Цена за билет:</strong> {pricePerTicket} BYN</p>
            <p><strong>Итого к оплате:</strong> {totalPrice} BYN</p>

            <p><strong>Статус оплаты:</strong>
              <span className={`badge badge-payment-${paid ? 'paid' : 'pending'}`}>
                {paid ? 'Оплачено' : 'Не оплачено'}
              </span>
            </p>

            {!paid && (
              <div className="payment-actions">
                <button
                  type="button"
                  className="btn primary"
                  onClick={handlePay}
                  disabled={paying}
                >
                  {paying ? 'Оплата…' : 'Оплатить'}
                </button>
              </div>
            )}

            {paid && (
              <div className="msg msg-success">
                ✅ Оплачено. Билеты куплены и добавлены в ваш список.
              </div>
            )}

            {error && (
              <div className="msg msg-error">{error}</div>
            )}

            <div className="payment-nav" style={{ marginTop: 20 }}>
              <Link to="/" className="btn secondary">← Вернуться к списку билетов</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
