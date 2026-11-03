import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
});

// Перехватчик запроса: подставляем JWT-токен
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Перехватчик ответа: нормализуем ошибки
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Ошибка сети';
    return Promise.reject(new Error(message));
  }
);

export const fetchTickets = (params = {}, signal) =>
  api.get('/tickets', { params, signal }).then((r) => r.data);

export const fetchTicket = (id) => api.get(`/tickets/${id}`).then((r) => r.data);

export const createTicket = (data) => api.post('/tickets', data).then((r) => r.data);

export const updateTicket = (id, data) =>
  api.put(`/tickets/${id}`, data).then((r) => r.data);

export const deleteTicket = (id) => api.delete(`/tickets/${id}`).then((r) => r.data);

export const loginRequest = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const registerRequest = (email, password) =>
  api.post('/auth/register', { email, password }).then((r) => r.data);

export default api;
