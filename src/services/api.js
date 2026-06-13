// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://taskmanager-backend-2-lfhf.onrender.com/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

// Tasks
export const getTasks = () => API.get('/tasks');
export const createTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const updateStatus = (id, status) => API.patch(`/tasks/${id}/status?status=${status}`);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);
