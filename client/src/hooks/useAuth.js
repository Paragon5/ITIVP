import { useState, useEffect, useCallback } from 'react';
import { loginRequest, registerRequest } from '../api.js';

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('lottery_auth');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const raw = localStorage.getItem('lottery_auth');
      const u = raw ? JSON.parse(raw) : null;
      return u?.role === 'admin';
    } catch {
      return false;
    }
  });

  const [error, setError] = useState('');

  const clearError = useCallback(() => setError(''), []);

  const persistUser = useCallback((token, profileOverride) => {
    const payload = parseJwt(token);
    const email = payload.email;
    let profile = profileOverride;
    if (!profile) {
      try {
        profile = JSON.parse(localStorage.getItem('lottery_profile_' + email) || 'null');
      } catch {
        profile = null;
      }
    }
    const user = {
      id: payload.id,
      email,
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      name: email,
      role: payload.role || 'user',
      token,
    };
    localStorage.setItem('token', token);
    localStorage.setItem('lottery_auth', JSON.stringify(user));
    setCurrentUser(user);
    setIsAdmin(user.role === 'admin');
    return user;
  }, []);

  const register = useCallback(
    async (firstName, lastName, email, password, remember) => {
      clearError();
      if (!firstName || !lastName || !email || !password) {
        setError('Заполните имя, фамилию, email и пароль.');
        return;
      }
      if (password.length < 4) {
        setError('Пароль должен содержать минимум 4 символа.');
        return;
      }
      try {
        localStorage.setItem('lottery_profile_' + email, JSON.stringify({ firstName, lastName }));
        await registerRequest(email, password);
        const data = await loginRequest(email, password);
        persistUser(data.token, { firstName, lastName });
        setError('');
        if (remember) {
          localStorage.setItem('lottery_auth_remember', 'true');
        } else {
          localStorage.removeItem('lottery_auth_remember');
        }
      } catch (err) {
        setError(err.message || 'Ошибка регистрации');
      }
    },
    [clearError, persistUser]
  );

  const login = useCallback(
    async (email, password, remember) => {
      clearError();
      if (!email || !password) {
        setError('Введите email и пароль.');
        return;
      }
      try {
        const data = await loginRequest(email, password);
        const profile = JSON.parse(localStorage.getItem("lottery_profile_" + email) || "null");
        persistUser(data.token, profile);
        if (remember) {
          localStorage.setItem('lottery_auth_remember', 'true');
        } else {
          localStorage.removeItem('lottery_auth_remember');
        }
      } catch (err) {
        setError(err.message || 'Неверный email или пароль');
      }
    },
    [clearError, persistUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('lottery_auth');
    localStorage.removeItem('lottery_auth_remember');
    setCurrentUser(null);
    setIsAdmin(false);
    setError('');
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('lottery_auth');
    setCurrentUser(null);
    setIsAdmin(false);
  }, []);

  useEffect(() => {
    const remember = localStorage.getItem('lottery_auth_remember');
    if (currentUser && remember === 'true') {
      localStorage.setItem('lottery_auth_remember', 'true');
    }
  }, [currentUser]);

  const isAuthenticated = !!currentUser;

  return {
    currentUser,
    isAuthenticated,
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
  localStorage.removeItem('token');
  localStorage.removeItem('lottery_auth');
  localStorage.removeItem('lottery_auth_remember');
}

