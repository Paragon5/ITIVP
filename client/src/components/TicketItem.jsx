import React from 'react';

const STATUS_LABELS = {
  active: 'Активен',
  winner: 'Выигрышный',
  expired: 'Истёк',
};

function TicketItem({ ticket, onDelete }) {
  const formattedDate = new Date(ticket.purchaseDate).toLocaleString('ru-RU');

  return (
    <li className={`ticket-item status-${ticket.status}`}>
      <div className="ticket-info">
        <span className="ticket-owner">{ticket.owner}</span>
        <span className="ticket-numbers">{ticket.numbers.join(', ')}</span>
        <span className="ticket-meta">
          <span className={`badge badge-${ticket.status}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
          <span className="ticket-date">{formattedDate}</span>
          <span className="ticket-prize">
            {ticket.prizeAmount > 0 ? `Приз: ${ticket.prizeAmount.toLocaleString('ru-RU')} Br` : 'Без приза'}
          </span>
        </span>
      </div>
      <div className="ticket-actions">
        <button type="button" className="danger" onClick={() => onDelete(ticket.id)}>
          Удалить
        </button>
      </div>
    </li>
  );
}

export default React.memo(TicketItem);
