import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error(
        `[API Error ${error.response.status}]:`,
        error.response.data
      );
    } else if (error.request) {
      console.error(
        '[API Error]: O backend não respondeu. Verifique se o container em http://localhost:3000 está rodando.'
      );
    } else {
      console.error('[API Error]:', error.message);
    }

    return Promise.reject(error);
  }
);