import axios from 'axios';
import { store } from '@/app/store';

const callsApi = axios.create({
  baseURL: import.meta.env.VITE_CALLS_API_URL ?? 'http://localhost:3003/api',
});

callsApi.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default callsApi;
