export type Situacao = 'pcd-condutor' | 'pcd-nao-condutor' | 'responsavel';

export type Categoria =
  | 'fisica'
  | 'visual'
  | 'auditiva'
  | 'intelectual'
  | 'autismo'
  | 'nao-tenho-certeza';

export type UsoIsencao = 'nao' | 'sim' | 'sim-perdi';

export type SituacaoLaudo = 'recente' | 'antigo' | 'ainda-nao';

export type QuantidadeCondutores = 1 | 2 | 3;

export interface RespostasPerfil {
  situacao?: Situacao;
  categoria?: Categoria;
  isencao?: UsoIsencao;
  condutores?: QuantidadeCondutores;
  laudo?: SituacaoLaudo;
}

export type ChaveEtapaPerfil =
  | 'identificacao'
  | 'representante'
  | 'documentos-medicos'
  | 'obter-laudo'
  | 'minha-cnh'
  | 'condutores'
  | 'comprovacao-perda'
  | 'renda'
  | 'veiculo'
  | 'revisao';

export interface EtapaPerfil {
  chave: ChaveEtapaPerfil;
  titulo: string;
  documentos: string[];
  cartoesCondutor?: number;
}

export interface ResultadoPerfil {
  situacao: Situacao;
  reclassificado: boolean;
  etapas: EtapaPerfil[];
  tags: string[];
  tagsResumo: string[];
  textoResumo: string;
  cartaoPerfil: { titulo: string; detalhe: string };
}

const SITUACOES: readonly Situacao[] = [
  'pcd-condutor',
  'pcd-nao-condutor',
  'responsavel',
];

const CATEGORIAS: readonly Categoria[] = [
  'fisica',
  'visual',
  'auditiva',
  'intelectual',
  'autismo',
  'nao-tenho-certeza',
];

const USOS_ISENCAO: readonly UsoIsencao[] = ['nao', 'sim', 'sim-perdi'];

const SITUACOES_LAUDO: readonly SituacaoLaudo[] = [
  'recente',
  'antigo',
  'ainda-nao',
];

const ROTULO_SITUACAO: Record<Situacao, string> = {
  'pcd-condutor': 'PcD condutor',
  'pcd-nao-condutor': 'PcD não condutor',
  responsavel: 'Responsável',
};

const ROTULO_CATEGORIA: Record<Categoria, string> = {
  fisica: 'Deficiência física',
  visual: 'Deficiência visual',
  auditiva: 'Deficiência auditiva',
  intelectual: 'Deficiência intelectual',
  autismo: 'Autismo',
  'nao-tenho-certeza': 'Deficiência a confirmar',
};

const ROTULO_ISENCAO: Record<Exclude<UsoIsencao, 'nao'>, string> = {
  sim: 'Já possui isenção',
  'sim-perdi': 'Isenção anterior perdida',
};

const ROTULO_ISENCAO_RESUMO: Record<UsoIsencao, string> = {
  nao: 'Não usou nos últimos 3 anos',
  sim: 'Já usou nos últimos 3 anos',
  'sim-perdi': 'Isenção anterior perdida',
};

const ROTULO_LAUDO: Record<SituacaoLaudo, string> = {
  recente: 'Laudo recente',
  antigo: 'Laudo antigo',
  'ainda-nao': 'Sem laudo ainda',
};

function valorValido<T extends string>(
  valor: unknown,
  validos: readonly T[]
): T | undefined {
  return validos.includes(valor as T) ? (valor as T) : undefined;
}

export function normalizarRespostas(bruto: unknown): RespostasPerfil {
  if (typeof bruto !== 'object' || bruto === null) {
    return {};
  }

  const r = bruto as Record<string, unknown>;
  const quantidade = Number(r.condutores);

  return {
    situacao: valorValido(r.situacao, SITUACOES),
    categoria: valorValido(r.categoria, CATEGORIAS),
    isencao: valorValido(r.isencao, USOS_ISENCAO),
    condutores:
      quantidade === 1 || quantidade === 2 || quantidade === 3
        ? quantidade
        : undefined,
    laudo: valorValido(r.laudo, SITUACOES_LAUDO),
  };
}

const LAUDO_COM_CID = 'Laudo médico com CID e caracterização da deficiência';

function documentosMedicos(categoria?: Categoria): string[] {
  switch (categoria) {
    case 'visual':
      return ['Laudo oftalmológico'];
    case 'auditiva':
      return [LAUDO_COM_CID, 'Audiograma (perda auditiva bilateral)'];
    case 'intelectual':
    case 'autismo':
      return [LAUDO_COM_CID, 'Documento do responsável legal (quando houver)'];
    default:
      return [LAUDO_COM_CID];
  }
}

function documentosCondutores(quantidade: number): string[] {
  return quantidade === 1
    ? [
        'CNH do condutor (válida e na categoria certa)',
        'Comprovante de vínculo com o condutor',
      ]
    : [
        `CNH dos ${quantidade} condutores (válida e na categoria certa)`,
        'Comprovante de vínculo com cada condutor',
      ];
}

function documentosMinhaCnh(categoria?: Categoria): string[] {
  const itens = ['CNH válida e na categoria certa'];

  if (categoria === 'fisica') {
    itens.push('CNH com as adaptações do veículo');
  }

  return itens;
}

export function montarPerfil(respostas: RespostasPerfil): ResultadoPerfil {
  const { categoria, isencao, laudo } = respostas;

  const situacaoInformada: Situacao = respostas.situacao ?? 'pcd-nao-condutor';

  const reclassificado =
    situacaoInformada === 'pcd-condutor' && categoria === 'visual';
  const situacao: Situacao = reclassificado
    ? 'pcd-nao-condutor'
    : situacaoInformada;

  const ehCondutor = situacao === 'pcd-condutor';

  const quantidade = ehCondutor ? undefined : (respostas.condutores ?? 1);

  const identificacao: EtapaPerfil = {
    chave: 'identificacao',
    titulo: 'Identificação',
    documentos: [
      'Documento de identidade (RG ou CNH)',
      'CPF ativo',
      'Comprovante de endereço (até 90 dias)',
    ],
  };

  const representante: EtapaPerfil = {
    chave: 'representante',
    titulo: 'Documentos do representante',
    documentos: [
      'Documento de identidade do representante',
      'Comprovante de que representa a pessoa com deficiência',
    ],
  };

  const medica: EtapaPerfil =
    laudo === 'ainda-nao'
      ? {
          chave: 'obter-laudo',
          titulo: 'Como conseguir seu laudo',
          documentos: ['Guia para conseguir o seu laudo médico'],
        }
      : {
          chave: 'documentos-medicos',
          titulo: 'Documentos médicos',
          documentos: documentosMedicos(categoria),
        };

  const condutor: EtapaPerfil = ehCondutor
    ? {
        chave: 'minha-cnh',
        titulo: 'Minha CNH',
        documentos: documentosMinhaCnh(categoria),
      }
    : {
        chave: 'condutores',
        titulo: 'Condutores autorizados',
        documentos: documentosCondutores(quantidade ?? 1),
        cartoesCondutor: quantidade ?? 1,
      };

  const comprovacaoPerda: EtapaPerfil = {
    chave: 'comprovacao-perda',
    titulo: 'Comprovação da perda',
    documentos: ['Boletim de ocorrência', 'Baixa do veículo'],
  };

  const renda: EtapaPerfil = {
    chave: 'renda',
    titulo: 'Renda e acesso gov.br',
    documentos: [
      'Declaração do Imposto de Renda (dispensada se financiar)',
      'Conta gov.br nível bronze ou superior',
    ],
  };

  const veiculo: EtapaPerfil = {
    chave: 'veiculo',
    titulo: 'Dados do veículo',
    documentos: [
      'Modelo 0 km dentro dos requisitos',
      'Valor estimado de até R$ 200 mil',
    ],
  };

  const revisao: EtapaPerfil = {
    chave: 'revisao',
    titulo: 'Revisão e dossiê',
    documentos: [
      'Revisão final dos dados e documentos',
      'Dossiê organizado para download',
      'Guia de envio pelo SISEN (passo a passo)',
    ],
  };

  const etapas: EtapaPerfil[] = [identificacao];

  if (situacao === 'responsavel') {
    etapas.push(representante);
  }

  etapas.push(medica, condutor);

  if (isencao === 'sim-perdi') {
    etapas.push(comprovacaoPerda);
  }

  etapas.push(renda, veiculo, revisao);

  if (laudo === 'ainda-nao') {
    etapas.splice(etapas.indexOf(medica), 1);
    etapas.unshift(medica);
  }

  const textoCondutores =
    quantidade === undefined
      ? undefined
      : `${quantidade} ${quantidade === 1 ? 'condutor' : 'condutores'}`;

  const tags: string[] = [ROTULO_SITUACAO[situacao]];

  if (categoria) {
    tags.push(ROTULO_CATEGORIA[categoria]);
  }

  if (textoCondutores) {
    tags.push(textoCondutores);
  }

  if (laudo) {
    tags.push(ROTULO_LAUDO[laudo]);
  }

  if (isencao && isencao !== 'nao') {
    tags.push(ROTULO_ISENCAO[isencao]);
  }

  const tagsResumo: string[] = [ROTULO_SITUACAO[situacao]];

  if (categoria) {
    tagsResumo.push(ROTULO_CATEGORIA[categoria]);
  }

  if (isencao) {
    tagsResumo.push(ROTULO_ISENCAO_RESUMO[isencao]);
  }

  if (textoCondutores) {
    tagsResumo.push(textoCondutores);
  }

  if (laudo) {
    tagsResumo.push(ROTULO_LAUDO[laudo]);
  }

  const descricaoCategoria =
    categoria && categoria !== 'nao-tenho-certeza'
      ? ROTULO_CATEGORIA[categoria].toLowerCase()
      : 'deficiência';

  const quemE =
    situacao === 'responsavel'
      ? `Como responsável por uma pessoa com ${descricaoCategoria}`
      : `Como pessoa com ${descricaoCategoria} (${ROTULO_SITUACAO[situacao]})`;

  const textoResumo = `${quemE}, você se enquadra nos critérios da Lei 8.989/95. Já montamos o seu passo a passo com base nas suas respostas.`;

  const detalhe = [
    categoria ? ROTULO_CATEGORIA[categoria] : undefined,
    textoCondutores
      ? `${textoCondutores} ${quantidade === 1 ? 'autorizado' : 'autorizados'}`
      : undefined,
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    situacao,
    reclassificado,
    etapas,
    tags,
    tagsResumo,
    textoResumo,
    cartaoPerfil: { titulo: ROTULO_SITUACAO[situacao], detalhe },
  };
}

export const ETAPAS_COM_TELA: readonly ChaveEtapaPerfil[] = [
  'identificacao',
  'representante',
  'documentos-medicos',
  'obter-laudo',
  'condutores',
  'minha-cnh',
  'comprovacao-perda',
  'renda',
  'veiculo',
  'revisao',
];

export function proximaEtapaComTela(
  etapas: EtapaPerfil[],
  chave: ChaveEtapaPerfil
): { etapa: EtapaPerfil; numero: number } | null {
  const posicao = etapas.findIndex((etapa) => etapa.chave === chave);

  if (posicao < 0) {
    return null;
  }

  for (let indice = posicao + 1; indice < etapas.length; indice += 1) {
    if (ETAPAS_COM_TELA.includes(etapas[indice].chave)) {
      return { etapa: etapas[indice], numero: indice + 1 };
    }
  }

  return null;
}

const ETAPAS_COM_DADOS_DO_PERFIL: readonly ChaveEtapaPerfil[] = [
  'documentos-medicos',
  'obter-laudo',
  'representante',
  'minha-cnh',
  'condutores',
  'comprovacao-perda',
];

function assinaturaDaEtapa(chave: ChaveEtapaPerfil, respostas: RespostasPerfil): string {
  const situacao = montarPerfil(respostas).situacao;

  switch (chave) {
    case 'documentos-medicos':
    case 'obter-laudo':
      return `${respostas.categoria ?? ''}|${respostas.laudo === 'ainda-nao' ? 'sem-laudo' : 'com-laudo'}`;
    case 'representante':
      return String(situacao === 'responsavel');
    case 'minha-cnh':
      return `${situacao === 'pcd-condutor'}|${respostas.categoria ?? ''}`;
    case 'condutores':
      return `${situacao === 'pcd-condutor'}|${respostas.condutores ?? ''}`;
    case 'comprovacao-perda':
      return String(respostas.isencao === 'sim-perdi');
    default:
      return '';
  }
}

export function etapasAfetadasPorMudanca(
  antes: RespostasPerfil | null,
  depois: RespostasPerfil
): ChaveEtapaPerfil[] {
  if (!antes) {
    return [];
  }

  return ETAPAS_COM_DADOS_DO_PERFIL.filter(
    (chave) => assinaturaDaEtapa(chave, antes) !== assinaturaDaEtapa(chave, depois)
  );
}