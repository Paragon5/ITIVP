import { useState } from 'react';
import { evaluateTicket } from '../utils/prize.js';

export default function TicketForm({ initialData, onUpdate, onCancelEdit }) {
  const [owner, setOwner] = useState(initialData.owner);
  const [numbersText, setNumbersText] = useState(initialData.numbers.join(', '));
  const [error, setError] = useState('');

  const parseNumbers = (text) => {
    const parts = text.split(/[,\s]+/).filter(Boolean);
    if (parts.length !== 6) return null;
    const nums = parts.map(Number);
    if (nums.some((n) => Number.isNaN(n) || n < 1 || n > 49)) return null;
    if (new Set(nums).size !== nums.length) return null;
    return nums;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const numbers = parseNumbers(numbersText);
    if (!owner.trim()) {
      setError('Укажите владельца билета');
      return;
    }
    if (!numbers) {
      setError('Числа: ровно 6 уникальных чисел в диапазоне 1–49, через запятую');
      return;
    }

    const evaluated = evaluateTicket(numbers, initialData.purchaseDate);

    onUpdate({
      ...initialData,
      owner: owner.trim(),
      numbers,
      status: evaluated.status,
      prizeAmount: evaluated.prizeAmount,
    });
    onCancelEdit();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onCancelEdit();
    }
  };

  return (
    <form className="ticket-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      <h2>Редактирование билета</h2>

      <label>
        Владелец:
        <input
          type="text"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="Иванов Иван"
        />
      </label>

      <label>
        Числа (ровно 6, от 1 до 49, через запятую):
        <input
          type="text"
          value={numbersText}
          onChange={(e) => setNumbersText(e.target.value)}
          placeholder="1, 2, 3, 4, 5, 6"
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit">Сохранить</button>
        <button type="button" className="secondary" onClick={onCancelEdit}>
          Отмена
        </button>
      </div>
      <p className="form-hint">Подсказка: Escape — отменить редактирование. Статус и приз определяются автоматически по набору чисел.</p>
    </form>
  );
}
