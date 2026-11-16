import { normalizarRespostas } from './regrasPerfil';
import type { RespostasPerfil } from './regrasPerfil';

const CHAVE_ATIVA = 'respostasQuiz';
const CHAVE_USUARIO_ATIVO = 'respostasQuizUsuario';
const PREFIXO_USUARIO = 'respostasQuiz:';
export const EVENTO_RESPOSTAS = 'respostasQuizAtualizadas';

function chaveDoUsuario(id: number): string {
  return `${PREFIXO_USUARIO}${id}`;
}

function lerRespostas(chave: string): RespostasPerfil | null {
  try {
    const texto = localStorage.getItem(chave);
    if (!texto) return null;
    const respostas = normalizarRespostas(JSON.parse(texto));
    return respostas.situacao ? respostas : null;
  } catch {
    return null;
  }
}

export function lerUsuarioAtivo(): number | null {
  try {
    const id = Number(localStorage.getItem(CHAVE_USUARIO_ATIVO));
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function avisarAtualizacao() {
  window.dispatchEvent(new Event(EVENTO_RESPOSTAS));
}

export function lerRespostasAtivas(): RespostasPerfil | null {
  return lerRespostas(CHAVE_ATIVA);
}

export function temRespostasDoUsuario(id: number): boolean {
  return lerRespostas(chaveDoUsuario(id)) !== null;
}

export function ativarRespostasDoUsuario(id: number) {
  try {
    localStorage.setItem(CHAVE_USUARIO_ATIVO, String(id));
    const respostas = lerRespostas(chaveDoUsuario(id));
    if (respostas) {
      localStorage.setItem(CHAVE_ATIVA, JSON.stringify(respostas));
    } else {
      localStorage.removeItem(CHAVE_ATIVA);
    }
  } catch {
    return;
  }
  avisarAtualizacao();
}

export function salvarRespostasDoUsuario(
  id: number | null,
  respostas: RespostasPerfil
) {
  const texto = JSON.stringify(respostas);
  try {
    if (id !== null) {
      localStorage.setItem(chaveDoUsuario(id), texto);
      localStorage.setItem(CHAVE_USUARIO_ATIVO, String(id));
    }
    localStorage.setItem(CHAVE_ATIVA, texto);
  } catch {
    return;
  }
  avisarAtualizacao();
}

export function atualizarRespostasAtivas(mudancas: Partial<RespostasPerfil>) {
  const atuais = lerRespostas(CHAVE_ATIVA);
  if (!atuais) return;

  const texto = JSON.stringify({ ...atuais, ...mudancas });
  const id = lerUsuarioAtivo();

  try {
    localStorage.setItem(CHAVE_ATIVA, texto);
    if (id !== null) {
      localStorage.setItem(chaveDoUsuario(id), texto);
    }
  } catch {
    return;
  }
  avisarAtualizacao();
}

export function limparRespostasAtivas() {
  try {
    localStorage.removeItem(CHAVE_ATIVA);
    localStorage.removeItem(CHAVE_USUARIO_ATIVO);
  } catch {
    return;
  }
}