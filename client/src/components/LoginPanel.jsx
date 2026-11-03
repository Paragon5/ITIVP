import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';


export default function LoginPanel() {
  const { login, register, error, clearError, isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();

    if (mode === 'login') {
      login(email, password, remember);
    } else {
      register(firstName, lastName, email, password, remember);
    }
  };

  if (isAuthenticated && currentUser) {
    return <div className="login-panel"><p className="sub">Перенаправление…</p></div>;
  }

  return (
    <div className="login-panel">
      <h1>Лотерейные билеты</h1>
      <p className="sub">
        Войдите, чтобы создавать билеты и смотреть статистику.
        {mode === 'login' && (
          <>
            <br />
            <span className="text-dim">Ещё нет аккаунта?</span>
            <button
              type="button"
              className="switch-link"
              onClick={() => setMode('register')}
            >
              Зарегистрироваться
            </button>
          </>
        )}
      </p>

      {error && <div className="msg msg-error">{error}</div>}

      <form className="login-form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <>
            <label>
              Имя
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Иван"
                autoComplete="given-name"
                required
              />
            </label>
            <label>
              Фамилия
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Иванов"
                autoComplete="family-name"
                required
              />
            </label>
          </>
        )}

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 4 символа"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={4}
          />
        </label>

        <div className="flex items-center justify-between w-full">
          {mode === 'login' && (
            <label className="flex items-center gap-8 text-dim">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Запомнить меня
            </label>
          )}
          <button
            type="button"
            className="switch-link"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>

        <button type="submit" className={`btn-login ${mode === 'login' ? '' : 'btn-register'}`}>
          {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
}

