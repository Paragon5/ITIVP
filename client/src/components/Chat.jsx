import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export default function Chat() {
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [user, setUser] = useState(localStorage.getItem('chat_user') || '');
  const [room, setRoom] = useState(localStorage.getItem('chat_room') || 'general');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!user) return;
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !joined) return;
    socket.emit('join room', room);
    fetch(`${SOCKET_URL.replace('ws', 'http')}/api/messages?room=${encodeURIComponent(room)}&limit=100`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMessages(data); })
      .catch((err) => console.error('Не удалось загрузить историю:', err));
  }, [room, joined, SOCKET_URL]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('chat message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    });
    socket.on('typing', ({ user: tUser }) => {
      if (tUser === user) return;
      setTypingUsers((prev) => (prev.includes(tUser) ? prev : [...prev, tUser]));
      setTimeout(() => { setTypingUsers((prev) => prev.filter((u) => u !== tUser)); }, 3000);
    });
    return () => {
      socket.off('chat message');
      socket.off('typing');
    };
  }, [socketRef.current, user]);

  const handleJoin = () => {
    if (!user.trim() || !room.trim()) return;
    localStorage.setItem('chat_user', user.trim());
    localStorage.setItem('chat_room', room.trim());
    setJoined(true);
    setMessages([]);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!socket || !text.trim()) return;
    socket.emit('chat message', { room, text: text.trim(), user: user.trim() });
    setText('');
  };

  const handleTyping = () => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('typing', { room, user: user.trim() });
  };

  if (!joined) {
    return (
      <div className="app-wrapper">
        <div className="chat-join">
          <h2>Чат в реальном времени</h2>
          <p>Подключитесь к комнате для обмена сообщениями.</p>
          <form onSubmit={handleJoin} className="join-form">
            <div className="input-group">
              <label>Ваше имя</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Иван"
                required
              />
            </div>
            <div className="input-group">
              <label>Комната</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="general"
                required
              />
            </div>
            <button type="submit" className="btn primary">Войти в чат</button>
          </form>
          <p className="hint">Пример комнат: general, support, orders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="chat">
        <header className="chat-header">
          <div>
            <h2>💬 Комната: <span className="room-name">{room}</span></h2>
            <p className="user-info">Вы вошли как <strong>{user}</strong></p>
          </div>
          <div className="chat-status">
            {connected ? (
              <span className="status-dot status-online"></span>
            ) : (
              <span className="status-dot status-offline"></span>
            )}
            {connected ? 'Подключено' : 'Отключено'}
          </div>
          <button className="btn secondary" onClick={() => setJoined(false)}>Сменить комнату</button>
        </header>

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'печатает...' : 'печатают...'}
          </div>
        )}

        <div className="messages" ref={messagesEndRef}>
          {messages.length === 0 && (
            <div className="empty">Сообщений пока нет. Напишите первое!</div>
          )}
          {messages.map((msg, i) => (
            <div
              key={msg._id || i}
              className={`message ${msg.user === user ? 'message-own' : 'message-other'}`}
            >
              <div className="message-header">
                <span className="message-user">{msg.user}</span>
                <span className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="message-text">{msg.text}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="chat-form">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTyping();
            }}
            placeholder="Сообщение..."
            disabled={!connected}
          />
          <button type="submit" className="btn primary" disabled={!connected || !text.trim()}>
            Отправить
          </button>
        </form>

        {!connected && (
          <div className="msg msg-error">Соединение потеряно. Переподключение...</div>
        )}
      </div>
    </div>
  );
}
