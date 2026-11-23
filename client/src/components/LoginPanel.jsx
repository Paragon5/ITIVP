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

  const nameRegex = /^[А-Яа-яЁёA-Za-z]+(?:[- ]?[А-Яа-яЁёA-Za-z]+)*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateName = (value, field) => {
    const v = value.trim();
    if (!v) {
      return `Поле '${field}' обязательно`;
    }
    if (v.length < 2 || v.length > 30) {
      return `Поле '${field}' должно содержать от 2 до 30 символов`;
    }
    if (!nameRegex.test(v)) {
      return `Поле '${field}' может содержать только буквы, пробелы и дефис (без цифр)`;
    }
    return null;
  };

  const validateEmail = (value) => {
    const v = value.trim();
    if (!v) {
      return 'Поле E-mail обязательно';
    }
    if (!emailRegex.test(v)) {
      return 'Введите корректный E-mail';
    }
    return null;
  };

  const validatePassword = (value) => {
    if (!value) {
      return 'Поле Пароль обязательно';
    }
    if (value.length < 4) {
      return 'Пароль должен содержать минимум 4 символа';
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();

    if (mode === 'login') {
      const errEmail = validateEmail(email);
      const errPassword = validatePassword(password);
      if (errEmail || errPassword) {
        setError([errEmail, errPassword].filter(Boolean).join('. '));
        return;
      }
      login(email.trim(), password, remember);
    } else {
      const errFirstName = validateName(firstName, 'Имя');
      const errLastName = validateName(lastName, 'Фамилия');
      if (errFirstName || errLastName) {
        setError([errFirstName, errLastName].filter(Boolean).join('. '));
        return;
      }
      register(firstName.trim(), lastName.trim(), email.trim(), password, remember);
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
                pattern="[А-Яа-яЁёA-Za-z]+(?:[- ][А-Яа-яЁёA-Za-z]+)*"
                maxLength="30"
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
                pattern="[А-Яа-яЁёA-Za-z]+(?:[- ][А-Яа-яЁёA-Za-z]+)*"
                maxLength="30"
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
            <label className="remember-me">
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

