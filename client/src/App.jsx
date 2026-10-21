import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TicketList from './components/TicketList.jsx';
import LoginPanel from './components/LoginPanel.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import './index.css';

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

