import { useState, useEffect, useCallback } from 'react';

/**
 * Хранилище аутентификации.
 *
 * Без HTTP-сервера в рамках лабораторной невозможно проверить пароль на
 * бэкенде, поэтому вся «сессия» живёт в localStorage. Экспортируются
 *  - useAuth: получить текущего пользователя, залогиниться/выйти/зарегистрироваться;
 *  - clearAuth: удалить токен/пользователя и перенаправить на /login;
 *  - useToggleAdmin: стейт "пользователь/админ" для индикации роли в шапке и
 *    для того, чтобы админские кнопки управлялись единым источником.
 *
 * Пароли хранятся в памяти и в localStorage как строка, имитирующая JWT сессию.
 * В следующих лабораторных (№4/№5) это заменится на JWT и HTTP-only cookies.
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('lottery_auth');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  const clearError = useCallback(() => setError(''), []);

  const register = useCallback(
    (email, password, name, remember) => {
      clearError();

      if (!email || !password || !name) {
        setError('Заполните все поля (имя, email, пароль).');
        return;
      }

      if (password.length < 4) {
        setError('Пароль должен содержать минимум 4 символа.');
        return;
      }

      // Имитация JWT: в дальнейших лабораторных заменится на JWT access token.
      const token = btoa(`${email}:${password}`);

      const user = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        email,
        name,
        role: 'user',
        token,
      };

      localStorage.setItem('lottery_auth', JSON.stringify(user));
      setCurrentUser(user);
      setError('');

      if (remember) {
        localStorage.setItem('lottery_auth_remember', 'true');
      } else {
        localStorage.removeItem('lottery_auth_remember');
      }
    },
    [clearError]
  );

  const login = useCallback(
    (email, password, remember) => {
      clearError();

      if (!email || !password) {
        setError('Введите email и пароль.');
        return;
      }

      // Имитация запроса к /api/auth/login
      const stored = localStorage.getItem('lottery_users');
      const users = stored ? JSON.parse(stored) : [];
      const found = users.find((u) => u.email === email && u.password === password);

      if (!found) {
        setError('Неверный email или пароль.');
        return;
      }

      const user = {
        id: found.id,
        email: found.email,
        name: found.name,
        role: found.role,
        token: found.token,
      };

      localStorage.setItem('lottery_auth', JSON.stringify(user));
      setCurrentUser(user);
      setError('');

      if (remember) {
        localStorage.setItem('lottery_auth_remember', 'true');
      } else {
        localStorage.removeItem('lottery_auth_remember');
      }
    },
    [clearError]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('lottery_auth');
    setCurrentUser(null);
    setIsAdmin(false);
    setError('');
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('lottery_auth');
    setCurrentUser(null);
    setIsAdmin(false);
  }, []);

  useEffect(() => {
    const remember = localStorage.getItem('lottery_auth_remember');
    if (currentUser && remember === 'true') {
      // При загрузке страницы заново сохраняем шпионский флаг, если он есть.
      localStorage.setItem('lottery_auth_remember', 'true');
    }
  }, [currentUser]);

  return {
    currentUser,
    isAdmin,
    setIsAdmin,
    error,
    clearError,
    login,
    register,
    logout,
    clearAuth,
  };
}

export function clearAuth() {
  localStorage.removeItem('lottery_auth');
  localStorage.removeItem('lottery_auth_remember');
}
