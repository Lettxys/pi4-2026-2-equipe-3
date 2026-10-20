import axios, { AxiosError, isAxiosError } from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const TOKEN_KEY = 'token';

export const api = axios.create({
  baseURL: API_URL,

  headers: {
    'Content-Type': 'application/json',
  },

  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
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
      console.error('[API Error]: O backend não respondeu.');
    } else {
      console.error('[API Error]:', error.message);
    }

    return Promise.reject(error);
  }
);

const AUTH = '/api/auth';

export const ROTAS = {
  registrar: `${AUTH}/register`,
  login: `${AUTH}/login`,
  eu: `${AUTH}/me`,
  esqueciSenha: `${AUTH}/forgot-password`,
  verificarCodigo: `${AUTH}/verify-code`,
  redefinirSenha: `${AUTH}/reset-password`,
  alterarSenha: `${AUTH}/change-password`,
  sair: `${AUTH}/logout`,
};

export type TipoPerfil = number | string;

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  userId: number;
  fullName: string;
  email: string;
  profileType: TipoPerfil | null;
  activeProcessId: number | null;
}

export interface RegistrarData {
  fullName: string;
  cpf: string;
  email: string;
  phone?: string;
  password: string;
}

export interface RegisterResponse {
  userId: number;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface MeResponse {
  userId: number;
  fullName: string;
  cpf: string | null;
  email: string | null;
  profileType: TipoPerfil | null;
  activeProcessId: number | null;
}

export interface VerificarCodigoData {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  resetToken: string;
}

export interface RedefinirSenhaData {
  token: string;
  newPassword: string;
}

export interface AlterarSenhaData {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

interface ApiErrorBody {
  message?: string;
  details?: { field?: string | null; message: string }[];
}

export function extrairMensagemDeErro(error: unknown, padrao: string): string {
  if (!isAxiosError(error)) {
    return padrao;
  }

  if (!error.response) {
    return 'Não foi possível conectar ao servidor.';
  }

  const dados = error.response.data as ApiErrorBody | undefined;

  const detalhes = (dados?.details ?? [])
    .map((item) => item.message)
    .filter(Boolean);

  if (detalhes.length > 0) {
    return detalhes.join(' ');
  }

  return dados?.message ?? padrao;
}

export async function fazerLogin(dados: LoginData) {
  const resposta = await api.post<LoginResponse>(ROTAS.login, dados);

  localStorage.setItem(TOKEN_KEY, resposta.data.accessToken);

  return resposta.data;
}

export async function registrarUsuario(dados: RegistrarData) {
  const resposta = await api.post<RegisterResponse>(ROTAS.registrar, dados);

  return resposta.data;
}

export async function buscarUsuarioLogado() {
  const resposta = await api.get<MeResponse>(ROTAS.eu);

  return resposta.data;
}

export async function esqueciSenha(email: string) {
  const resposta = await api.post<MessageResponse>(ROTAS.esqueciSenha, {
    email,
  });

  return resposta.data;
}

export async function verificarCodigo(dados: VerificarCodigoData) {
  const resposta = await api.post<VerifyCodeResponse>(
    ROTAS.verificarCodigo,
    dados
  );

  return resposta.data;
}

export async function redefinirSenha(dados: RedefinirSenhaData) {
  const resposta = await api.post<MessageResponse>(
    ROTAS.redefinirSenha,
    dados
  );

  return resposta.data;
}

export async function alterarSenha(dados: AlterarSenhaData) {
  const resposta = await api.patch<MessageResponse>(
    ROTAS.alterarSenha,
    dados
  );

  return resposta.data;
}

export async function sair() {
  try {
    await api.post<MessageResponse>(ROTAS.sair);
  } finally {
    localStorage.removeItem(TOKEN_KEY);
  }
}