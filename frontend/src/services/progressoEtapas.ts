import type { ChaveEtapaPerfil } from './regrasPerfil';
import { lerUsuarioAtivo } from './respostasPerfil';

const CHAVE_LEGADA = 'etapasConcluidas';
const PREFIXO_USUARIO = 'etapasConcluidas:';

export type ChaveEtapa = ChaveEtapaPerfil;

export const CHAVE_POR_TITULO: Record<string, ChaveEtapa> = {
  'Identificação': 'identificacao',
  'Documentos médicos': 'documentos-medicos',
  'Condutores autorizados': 'condutores',
  'Renda e acesso gov.br': 'renda',
  'Dados do veículo': 'veiculo',
  'Revisão e dossiê': 'revisao',
};

const CHAVES_VALIDAS: ChaveEtapa[] = [
  'identificacao',
  'representante',
  'documentos-medicos',
  'obter-laudo',
  'minha-cnh',
  'condutores',
  'comprovacao-perda',
  'renda',
  'veiculo',
  'revisao',
];

function chaveDoUsuario(): string | null {
  const id = lerUsuarioAtivo();

  return id === null ? null : `${PREFIXO_USUARIO}${id}`;
}

export function lerEtapasConcluidas(): ChaveEtapa[] {
  const chave = chaveDoUsuario();

  if (!chave) {
    return [];
  }

  try {
    const dados: unknown = JSON.parse(localStorage.getItem(chave) || '[]');

    if (!Array.isArray(dados)) {
      return [];
    }

    return dados.filter((item): item is ChaveEtapa =>
      CHAVES_VALIDAS.includes(item as ChaveEtapa)
    );
  } catch {
    return [];
  }
}

export function marcarEtapaConcluida(chave: ChaveEtapa) {
  const armazenamento = chaveDoUsuario();

  if (!armazenamento) {
    return;
  }

  const atuais = lerEtapasConcluidas();

  if (atuais.includes(chave)) {
    return;
  }

  try {
    localStorage.setItem(armazenamento, JSON.stringify([...atuais, chave]));
  } catch {
    return;
  }
}

export function desmarcarEtapaConcluida(chave: ChaveEtapa) {
  const armazenamento = chaveDoUsuario();

  if (!armazenamento) {
    return;
  }

  const atuais = lerEtapasConcluidas();

  if (!atuais.includes(chave)) {
    return;
  }

  try {
    localStorage.setItem(
      armazenamento,
      JSON.stringify(atuais.filter((item) => item !== chave))
    );
  } catch {
    return;
  }
}

export function limparEtapasConcluidas() {
  try {
    localStorage.removeItem(CHAVE_LEGADA);
  } catch {
    return;
  }
}