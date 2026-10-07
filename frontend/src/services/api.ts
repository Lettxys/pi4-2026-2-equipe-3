import axios, { AxiosError } from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

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
        '[API Error]: O backend não respondeu.'
      );

    } else {

      console.error(
        '[API Error]:',
        error.message
      );

    }

    return Promise.reject(error);
  }
);

export interface LoginData {
  emailCpf: string;
  senha: string;
}

export interface RegistrarData {
  nome: string;
  cpfTelefone: string;
  email: string;
  senha: string;
}

export async function fazerLogin(
  dados: LoginData
) {

  const resposta = await api.post(
    '/ROTA-LOGIN',
    dados
  );

  return resposta.data;
}

export async function registrarUsuario(
  dados: RegistrarData
) {

  const resposta = await api.post(
    '/ROTA-REGISTRO',
    dados
  );

  return resposta.data;
}