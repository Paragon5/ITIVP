import { useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Активен' },
  { value: 'winner', label: 'Выигрышный' },
  { value: 'expired', label: 'Истёк' },
];

/**
 * TicketForm — контролируемая форма редактирования билета (доступна админу).
 * Все входы контролируются через useState. initialData — редактируемый
 * билет; родитель передаёт key={id}, чтобы форма перемонтировалась
 * и поля инициализировались данными выбранного билета.
 * Клавиша Escape отменяет редактирование.
 */
export default function TicketForm({ initialData, onUpdate, onCancelEdit }) {
  // Состояния полей формы (контролируемые компоненты),
  // инициализируются данными редактируемого билета
  const [owner, setOwner] = useState(initialData.owner);
  const [numbersText, setNumbersText] = useState(initialData.numbers.join(', '));
  const [status, setStatus] = useState(initialData.status);
  const [prizeAmount, setPrizeAmount] = useState(String(initialData.prizeAmount));
  const [error, setError] = useState('');

  // Разбор строки "3, 14, 22" в массив чисел с валидацией
  const parseNumbers = (text) => {
    const parts = text.split(/[,\s]+/).filter(Boolean);
    if (parts.length === 0 || parts.length > 6) return null;
    const nums = parts.map(Number);
    if (nums.some((n) => Number.isNaN(n) || n < 1 || n > 49)) return null;
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
      setError('Числа: 1–6 чисел в диапазоне 1–49, через запятую');
      return;
    }

    // Отправляем обновлённый билет наверх (в TicketList)
    onUpdate({
      ...initialData,
      owner: owner.trim(),
      numbers,
      status,
      prizeAmount: Math.max(0, Number(prizeAmount) || 0),
    });
    onCancelEdit();
  };

  // Обработка клавиши Escape — отмена редактирования
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onCancelEdit();
    }
  };

  // Поля заполняются данными редактируемого билета за счёт того, что
  // TicketList монтирует форму с key={editingTicket.id} —
  // при смене ключа компонент перемонтируется и useState переинициализируется
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
        Числа (1–6, от 1 до 49, через запятую):
        <input
          type="text"
          value={numbersText}
          onChange={(e) => setNumbersText(e.target.value)}
          placeholder="3, 14, 22, 35, 41"
        />
      </label>

      <label>
        Статус:
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Сумма приза, Br (BYN):
        <input
          type="number"
          min="0"
          step="100"
          value={prizeAmount}
          onChange={(e) => setPrizeAmount(e.target.value)}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit">Сохранить</button>
        <button type="button" className="secondary" onClick={onCancelEdit}>
          Отмена
        </button>
      </div>
      <p className="form-hint">Подсказка: Escape — отменить редактирование</p>
    </form>
  );
}
