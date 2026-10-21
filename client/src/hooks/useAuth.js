import { useState, useEffect, useCallback } from 'react';

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
