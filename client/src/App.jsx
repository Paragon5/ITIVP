import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TicketList from './components/TicketList.jsx';
import LoginPanel from './components/LoginPanel.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import './index.css';

/**
 * Схема маршрутов:
 *  - /login  — регистрация/авторизация (доступен всем);
 *  - /admin  — админка: карточки пользователей и билеты всех пользователей;
 *  - /       — основная страница: список билетов, создание билетов,
 *    просмотр статистики (для авторизованных).
 *
 * Все компоненты получают данные из хранилища в App (useAuth), однако
 * в рамках текущей лабораторной работа без сервера роль и данные
 * пользователя никогда не проверяются на бэкенде.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPanel />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/" element={<TicketList />} />
      </Routes>
    </BrowserRouter>
  );
}

