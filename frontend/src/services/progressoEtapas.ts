/*
  Progresso das etapas concluídas, guardado no navegador (localStorage).

  PROVISÓRIO: enquanto as etapas não validam no backend, é isto que
  desbloqueia a etapa seguinte no Overview. Quando o backend passar a
  avançar o `currentStep` (POST /api/processes/{id}/steps/{n}/validate),
  o Overview já usa o maior entre os dois valores, e este arquivo pode
  ser removido.
*/

const CHAVE_STORAGE = 'etapasConcluidas';

export type ChaveEtapa =
  | 'identificacao'
  | 'documentos-medicos'
  | 'condutores'
  | 'renda'
  | 'veiculo'
  | 'revisao';

// Título da etapa no Overview -> chave guardada.
// (A numeração muda conforme o perfil, por isso não se guarda o número.)
export const CHAVE_POR_TITULO: Record<string, ChaveEtapa> = {
  'Identificação': 'identificacao',
  'Documentos médicos': 'documentos-medicos',
  'Condutores autorizados': 'condutores',
  'Renda e acesso gov.br': 'renda',
  'Dados do veículo': 'veiculo',
  'Revisão e dossiê': 'revisao',
};

const CHAVES_VALIDAS = Object.values(CHAVE_POR_TITULO);

export function lerEtapasConcluidas(): ChaveEtapa[] {
  try {
    const dados: unknown = JSON.parse(
      localStorage.getItem(CHAVE_STORAGE) || '[]'
    );

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
  const atuais = lerEtapasConcluidas();

  if (atuais.includes(chave)) {
    return;
  }

  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify([...atuais, chave]));
  } catch {
    // Sem armazenamento disponível: a etapa só não fica registrada
  }
}

// Chamar ao sair da conta ou quando a sessão expirar, para o progresso
// de uma pessoa não aparecer para outra no mesmo navegador.
export function limparEtapasConcluidas() {
  try {
    localStorage.removeItem(CHAVE_STORAGE);
  } catch {
    // Nada a fazer
  }
}