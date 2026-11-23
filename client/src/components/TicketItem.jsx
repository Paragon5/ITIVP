import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const STATUS_LABELS = {
  active: 'Активен',
  winner: 'Выигрышный',
  expired: 'Истёк',
};

const PAYMENT_LABELS = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачено',
  cancelled: 'Отменён',
};

function TicketItem({ ticket, onDelete }) {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const isOwner = currentUser && (ticket.userId == currentUser.id || ticket.owner === currentUser.email);
  const canPay = ticket.paymentStatus === 'pending' && (isAdmin || isOwner);

  const handlePay = () => {
    navigate('/payment/' + ticket.id);
  };

  const formattedDate = new Date(ticket.purchaseDate).toLocaleString('ru-RU');
  const isPaid = ticket.paymentStatus === 'paid';

  return (
    <li className={'ticket-item status-' + ticket.status + (ticket._pending ? ' pending' : '')}>
      <div className="ticket-info">
        <span className="ticket-owner">{ticket.owner}</span>
        {isPaid && (
          <span className="ticket-numbers">{ticket.numbers.join(', ')}</span>
        )}
        <span className="ticket-meta">
          {isPaid && (
            <span className={'badge badge-' + ticket.status}>
              {STATUS_LABELS[ticket.status]}
            </span>
          )}
          <span className={'badge badge-payment-' + ticket.paymentStatus}>
            {PAYMENT_LABELS[ticket.paymentStatus]}
          </span>
          <span className="ticket-date">{formattedDate}</span>
          {isPaid && (
            <span className="ticket-prize">
              {ticket.prizeAmount > 0 ? 'Приз: ' + ticket.prizeAmount.toLocaleString('ru-RU') + ' Br' : 'Без приза'}
            </span>
          )}
        </span>
      </div>
      <div className="ticket-actions">
        {canPay && (
          <button type="button" className="secondary" onClick={handlePay}>
            Оплатить
          </button>
        )}
        {isAdmin && onDelete && (
          <button type="button" className="danger" onClick={() => onDelete(ticket.id)}>
            Удалить
          </button>
        )}
      </div>
    </li>
  );
}

export default React.memo(TicketItem);