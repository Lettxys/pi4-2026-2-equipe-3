import axios, { AxiosError, isAxiosError } from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const TOKEN_KEY = 'token';

export const EVENTO_SESSAO_EXPIRADA = 'sessao-expirada';

function lerToken(): string | null {
  return (
    localStorage.getItem(TOKEN_KEY) ??
    sessionStorage.getItem(TOKEN_KEY)
  );
}

function salvarToken(token: string, lembrar: boolean) {
  limparToken();

  if (lembrar) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function limparToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function temToken(): boolean {
  return Boolean(lerToken());
}

export const api = axios.create({
  baseURL: API_URL,

  headers: {
    'Content-Type': 'application/json',
  },

  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = lerToken();

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

    if (
      error.response?.status === 401 &&
      lerToken() &&
      error.config?.url !== ROTAS.login
    ) {
      limparToken();
      window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
    }

    return Promise.reject(error);
  }
);

const AUTH = '/api/auth';

export const ROTAS = {
  registrar: `${AUTH}/register`,
  login: `${AUTH}/login`,
  eu: `${AUTH}/me`,
  atualizarPerfil: `${AUTH}/me`,
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
  phone: string | null;
  profileType: TipoPerfil | null;
  activeProcessId: number | null;
}

export interface AtualizarPerfilData {
  fullName: string;
  email: string;
  phone: string | null;
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

export async function fazerLogin(dados: LoginData, lembrar = true) {
  const resposta = await api.post<LoginResponse>(ROTAS.login, dados);

  salvarToken(resposta.data.accessToken, lembrar);

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

export type PerfilProcesso = 'PCD_DRIVER' | 'PCD_NON_DRIVER';

export interface ProcessProgressResponse {
  processId: number;
  profileType: PerfilProcesso;
  fullName: string;
  currentStep: number;
  status: string;
  progressPercentage: number;
  updatedAt: string;
}

export interface DocumentChecklistItemResponse {
  documentType: string;
  authorizedDriverId: number | null;
  isRequired: boolean;
  isUploaded: boolean;
  status: string | null;
  expirationDate: string | null;
  alert: string | null;
}

export async function buscarProgressoProcesso(processId: number) {
  const resposta = await api.get<ProcessProgressResponse>(
    `/api/processes/${processId}`
  );

  return resposta.data;
}

export async function buscarChecklistDocumentos(processId: number) {
  const resposta = await api.get<DocumentChecklistItemResponse[]>(
    `/api/processes/${processId}/documents/checklist`
  );

  return resposta.data;
}

export async function atualizarPerfil(dados: AtualizarPerfilData) {
  const resposta = await api.patch<MeResponse>(ROTAS.atualizarPerfil, dados);

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
    limparToken();
  }
}

export interface DriverResponse {
  driverId: number;
  fullName: string;
  cpfMasked: string;
  cnhMasked: string;
  cnhExpiresAt: string | null;
  relationship: string | number;
  createdAt: string;
}

export interface ListDriversResponse {
  registeredDriversCount: number;
  maxAllowedDrivers: number;
  drivers: DriverResponse[];
}

export async function buscarCondutores(processId: number) {
  const resposta = await api.get<ListDriversResponse>(
    `/api/processes/${processId}/drivers`
  );

  return resposta.data;
}
export interface EnviarDocumentoData {
  file: File;
  documentType: string;
  issuedAt?: string;
  expiresAt?: string;
  authorizedDriverId?: number;
}

export interface UploadDocumentResponse {
  documentId: number;
  documentType: string;
  status: string;
  expirationDate: string | null;
  uploadedAt: string;
}

export async function enviarDocumento(
  processId: number,
  dados: EnviarDocumentoData
) {
  const formulario = new FormData();
  formulario.append('File', dados.file);
  formulario.append('DocumentType', dados.documentType);
  if (dados.issuedAt) formulario.append('IssuedAt', dados.issuedAt);
  if (dados.expiresAt) formulario.append('ExpiresAt', dados.expiresAt);
  if (dados.authorizedDriverId !== undefined) {
    formulario.append('AuthorizedDriverId', String(dados.authorizedDriverId));
  }

  const resposta = await api.post<UploadDocumentResponse>(
    `/api/processes/${processId}/documents`,
    formulario
  );

  return resposta.data;
}

export interface StepValidationError {
  code: string;
  field: string | null;
  documentId: number | null;
  message: string;
}

export interface StepValidationResponse {
  step: number;
  isValidated: boolean;
  nextStep: number | null;
  processStatus: string;
  validationErrors: StepValidationError[];
}

export async function validarEtapa(
  processId: number,
  stepNumber: number,
  financiado = false
) {
  const resposta = await api.post<StepValidationResponse>(
    `/api/processes/${processId}/steps/${stepNumber}/validate`,
    null,
    { params: financiado ? { financed: true } : undefined }
  );

  return resposta.data;
}