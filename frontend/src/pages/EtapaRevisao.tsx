import { useEffect, useMemo, useRef, useState } from 'react';

import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';
import {
  buscarChecklistDocumentos,
  buscarCondutores,
  buscarProgressoProcesso,
  buscarUsuarioLogado,
  extrairMensagemDeErro,
  temToken,
} from '../services/api';
import type {
  DocumentChecklistItemResponse,
  ListDriversResponse,
  PerfilProcesso,
} from '../services/api';

import './EtapaRevisao.css';

export type ChaveEtapa =
  | 'identificacao'
  | 'medicos'
  | 'condutores'
  | 'renda'
  | 'veiculo';

type FormatoDossie = 'pdf' | 'zip';
type Situacao = 'carregando' | 'ok' | 'sem-processo' | 'erro';

interface EtapaRevisaoProps {
  aoSair: () => void | Promise<void>;
  voltarTrilha: () => void;
  aoNavegar?: (destino: DestinoMenu) => void;
  // Chamado pelo botão "Editar" de cada linha da revisão.
  aoEditar?: (etapa: ChaveEtapa) => void;
  // O backend ainda não gera o dossiê; quando existir, basta passar a função
  // que faz o download aqui. Sem ela, a tela avisa que o recurso não está pronto.
  aoBaixarDossie?: (formato: FormatoDossie) => void | Promise<void>;
}

interface LinhaRevisao {
  chave: ChaveEtapa | 'perfil';
  titulo: string;
  detalhe: string;
  ok: boolean;
}

interface Toast {
  texto: string;
  tipo: 'sucesso' | 'aviso';
}

interface ResumoVeiculo {
  detalhe: string;
  ok: boolean;
}

// Numeração mostrada na tela (trilha do Overview).
const NUMERO_ETAPA = 6;
const TOTAL_ETAPAS = 6;

const URL_SISEN =
  'https://www.gov.br/pt-br/servicos/obter-isencao-de-impostos-para-comprar-carro';
const TETO_VALOR = 200000;
const TEMPO_TOAST = 4000;
const CHAVE_VEICULO = 'veiculo-rascunho';
const CHAVE_ENVIADO = 'revisao-enviado';

const TIPOS_IDENTIFICACAO = ['ID_CARD', 'CPF', 'PROOF_OF_ADDRESS'];
const TIPOS_MEDICOS = ['MEDICAL_REPORT_IPI', 'MEDICAL_REPORT_ICMS'];
const TIPOS_CNH_ESPECIAL = ['SPECIAL_DRIVER_LICENSE'];
const TIPOS_CONDUTORES = ['DRIVER_LICENSE'];
const TIPOS_RENDA = ['FINANCIAL_DECLARATION'];

const CATEGORIAS: Record<string, string> = {
  fisica: 'deficiência física',
  visual: 'deficiência visual',
  auditiva: 'deficiência auditiva',
  intelectual: 'deficiência intelectual',
  autismo: 'autismo',
};

const PASSOS_SISEN = [
  'Acesse o SISEN pelo site da Receita e entre com a sua conta gov.br.',
  'Escolha a isenção de IPI para pessoa com deficiência.',
  'Preencha o pedido com os dados do veículo.',
  'Anexe os arquivos do dossiê, na mesma ordem.',
  'Acompanhe o pedido pelo próprio SISEN.',
];

function plural(quantidade: number, singular: string, pluralTexto: string) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;
}

function lerCategoria(): string | null {
  try {
    const respostas = JSON.parse(localStorage.getItem('respostasQuiz') || '{}') as {
      categoria?: string;
    };
    return respostas.categoria ? (CATEGORIAS[respostas.categoria] ?? null) : null;
  } catch {
    return null;
  }
}

function lerEnviadoEm(userId: number): string | null {
  try {
    return localStorage.getItem(`${CHAVE_ENVIADO}:${userId}`);
  } catch {
    return null;
  }
}

// Lê o rascunho salvo pela Etapa 5 (o backend ainda não guarda o veículo).
function avaliarVeiculo(userId: number): ResumoVeiculo {
  try {
    const bruto = localStorage.getItem(`${CHAVE_VEICULO}:${userId}`);
    if (!bruto) return { detalhe: 'Dados do veículo não preenchidos', ok: false };

    const dados = JSON.parse(bruto) as Record<string, unknown>;
    const texto = (campo: string) =>
      typeof dados[campo] === 'string' ? (dados[campo] as string) : '';

    const marca = texto('marca');
    const modelo = texto('modelo').trim();
    const valorTabela = texto('valorTabela');
    const digitos = valorTabela.replace(/\D/g, '');
    const valor = digitos ? Number(digitos) / 100 : 0;
    const motor = Number(texto('motorizacao').match(/\d+(?:[.,]\d+)?/)?.[0].replace(',', '.'));
    const portas = texto('portas');

    if (!marca || !modelo || valor <= 0) {
      return { detalhe: 'Dados do veículo incompletos', ok: false };
    }

    const requisitosOk =
      texto('fabricadoBrasil') === 'sim' &&
      Number.isFinite(motor) &&
      motor <= 2 &&
      (portas === '4 portas' || portas === '5 portas') &&
      valor <= TETO_VALOR;

    return {
      detalhe: `${marca} ${modelo} · ${valorTabela} · ${
        requisitosOk ? 'requisitos ok' : 'confira os requisitos'
      }`,
      ok: requisitosOk,
    };
  } catch {
    return { detalhe: 'Não foi possível ler os dados do veículo', ok: false };
  }
}

function docValido(item: DocumentChecklistItemResponse) {
  return item.isUploaded && item.status !== 'REJECTED' && item.status !== 'EXPIRED';
}

function resumirDocumentos(
  checklist: DocumentChecklistItemResponse[] | null,
  tipos: string[]
): { detalhe: string; ok: boolean } {
  if (!checklist) return { detalhe: 'Não foi possível conferir os documentos', ok: false };

  const itens = checklist.filter((item) => tipos.includes(item.documentType));
  const validos = itens.filter(docValido).length;

  if (itens.length === 0) return { detalhe: 'Nenhum documento enviado', ok: false };
  if (validos === itens.length) {
    return {
      detalhe: plural(validos, 'documento conferido', 'documentos conferidos'),
      ok: true,
    };
  }

  return {
    detalhe: plural(itens.length - validos, 'documento pendente', 'documentos pendentes'),
    ok: false,
  };
}

function IconeCheck({ tamanho = 12 }: { tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={Math.round(tamanho * 0.83)}
      viewBox="0 0 12 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1 5L4.5 8.5L11 1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}

export default function EtapaRevisao({
  aoSair,
  voltarTrilha,
  aoNavegar,
  aoEditar,
  aoBaixarDossie,
}: EtapaRevisaoProps) {
  const [situacao, setSituacao] = useState<Situacao>('carregando');
  const [tentativa, setTentativa] = useState(0);
  const [etapaAtual, setEtapaAtual] = useState(NUMERO_ETAPA);
  const [userId, setUserId] = useState<number | null>(null);
  const [perfil, setPerfil] = useState<PerfilProcesso | null>(null);
  const [checklist, setChecklist] = useState<DocumentChecklistItemResponse[] | null>(null);
  const [condutores, setCondutores] = useState<ListDriversResponse | null>(null);
  const [veiculo, setVeiculo] = useState<ResumoVeiculo>({
    detalhe: 'Dados do veículo não preenchidos',
    ok: false,
  });
  const [categoria] = useState<string | null>(lerCategoria);

  const [declarou, setDeclarou] = useState(false);
  const [baixando, setBaixando] = useState<FormatoDossie | null>(null);
  const [enviadoEm, setEnviadoEm] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const temporizadorToast = useRef<number | undefined>(undefined);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!temToken()) {
        setSituacao('sem-processo');
        return;
      }

      try {
        const eu = await buscarUsuarioLogado();
        if (!ativo) return;

        setUserId(eu.userId);
        setEnviadoEm(lerEnviadoEm(eu.userId));
        setVeiculo(avaliarVeiculo(eu.userId));

        if (!eu.activeProcessId) {
          setSituacao('sem-processo');
          return;
        }

        const [prog, lista] = await Promise.all([
          buscarProgressoProcesso(eu.activeProcessId),
          buscarChecklistDocumentos(eu.activeProcessId).catch(() => null),
        ]);
        const motoristas =
          prog.profileType === 'PCD_NON_DRIVER'
            ? await buscarCondutores(eu.activeProcessId).catch(() => null)
            : null;
        if (!ativo) return;

        setEtapaAtual(prog.currentStep || NUMERO_ETAPA);
        setPerfil(prog.profileType);
        setChecklist(lista);
        setCondutores(motoristas);
        setSituacao('ok');
      } catch {
        if (ativo) setSituacao('erro');
      }
    }

    void carregar();
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  useEffect(() => {
    return () => window.clearTimeout(temporizadorToast.current);
  }, []);

  function mostrarToast(texto: string, tipo: Toast['tipo']) {
    window.clearTimeout(temporizadorToast.current);
    setToast({ texto, tipo });
    temporizadorToast.current = window.setTimeout(() => setToast(null), TEMPO_TOAST);
  }

  function tentarNovamente() {
    setSituacao('carregando');
    setTentativa((valor) => valor + 1);
  }

  const eCondutor = perfil === 'PCD_DRIVER';

  const linhas = useMemo<LinhaRevisao[]>(() => {
    const partesPerfil = [eCondutor ? 'PcD condutor' : 'PcD não condutor'];
    if (categoria) partesPerfil.push(categoria);
    if (!eCondutor && condutores) {
      partesPerfil.push(
        plural(
          condutores.registeredDriversCount,
          'condutor autorizado',
          'condutores autorizados'
        )
      );
    }

    const identificacao = resumirDocumentos(checklist, TIPOS_IDENTIFICACAO);
    const medicos = resumirDocumentos(checklist, TIPOS_MEDICOS);
    const habilitacao = eCondutor
      ? resumirDocumentos(checklist, TIPOS_CNH_ESPECIAL)
      : condutores && condutores.registeredDriversCount === 0
        ? { detalhe: 'Nenhum condutor cadastrado', ok: false }
        : resumirDocumentos(checklist, TIPOS_CONDUTORES);
    const renda = resumirDocumentos(checklist, TIPOS_RENDA);

    return [
      { chave: 'perfil', titulo: 'Perfil', detalhe: partesPerfil.join(' · '), ok: true },
      { chave: 'identificacao', titulo: 'Identificação', ...identificacao },
      { chave: 'medicos', titulo: 'Documentos médicos', ...medicos },
      {
        chave: 'condutores',
        titulo: eCondutor ? 'CNH especial' : 'Condutores autorizados',
        ...habilitacao,
      },
      {
        chave: 'renda',
        titulo: 'Renda e acesso gov.br',
        ...renda,
        detalhe: renda.ok ? 'Declaração financeira enviada' : renda.detalhe,
      },
      { chave: 'veiculo', titulo: 'Dados do veículo', ...veiculo },
    ];
  }, [categoria, checklist, condutores, eCondutor, veiculo]);

  const pendentes = linhas.filter((linha) => !linha.ok).length;
  const tudoOk = situacao === 'ok' && pendentes === 0;
  const podeBaixar = tudoOk && declarou && baixando === null;

  let numero = 0;

  async function baixar(formato: FormatoDossie) {
    if (!podeBaixar) return;

    if (!aoBaixarDossie) {
      mostrarToast('O download do dossiê ainda não está disponível nesta versão.', 'aviso');
      return;
    }

    setBaixando(formato);
    try {
      await aoBaixarDossie(formato);
    } catch (error) {
      mostrarToast(extrairMensagemDeErro(error, 'Não foi possível baixar o dossiê.'), 'aviso');
    } finally {
      setBaixando(null);
    }
  }

  function marcarEnviado() {
    const agora = new Date().toISOString();
    setEnviadoEm(agora);
    if (userId !== null) {
      try {
        localStorage.setItem(`${CHAVE_ENVIADO}:${userId}`, agora);
      } catch {
        // Sem armazenamento: a marcação vale só enquanto a tela está aberta.
      }
    }
    mostrarToast('Pedido marcado como enviado. Boa sorte!', 'sucesso');
  }

  function desfazerEnvio() {
    setEnviadoEm(null);
    if (userId !== null) {
      try {
        localStorage.removeItem(`${CHAVE_ENVIADO}:${userId}`);
      } catch {
        // Ignora: nada a desfazer fora da tela.
      }
    }
  }

  const dicaDossie = !tudoOk
    ? situacao === 'ok'
      ? `Resolva ${plural(pendentes, 'item pendente', 'itens pendentes')} acima para liberar o dossiê.`
      : 'Aguarde a conferência dos dados.'
    : !declarou
      ? 'Marque a declaração acima para liberar o download.'
      : 'Um PDF com o resumo dos dados e todos os documentos, na ordem pedida pelo SISEN.';

  return (
    <PainelLayout
      aoSair={aoSair}
      aoNavegar={aoNavegar}
      itemAtivo="processo"
      caminho={['Meu processo', `Etapa ${NUMERO_ETAPA} · Revisão e dossiê`]}
    >
      {toast && (
        <div className={`etapaRev-toast ${toast.tipo}`} role="status" aria-live="polite">
          <span className="etapaRev-toast-icone" aria-hidden="true">
            {toast.tipo === 'sucesso' ? <IconeCheck tamanho={10} /> : '!'}
          </span>
          {toast.texto}
        </div>
      )}

      <div className="etapaRev-layout">
        <div className="etapaRev-conteudo">
          <section className="etapaRev-principal">
            <button type="button" className="etapaRev-voltar" onClick={voltarTrilha}>
              <span aria-hidden="true">←</span>
              Voltar para a trilha
            </button>

            <div
              className="etapaRev-progresso-etapas"
              role="progressbar"
              aria-label="Etapas do processo"
              aria-valuenow={etapaAtual}
              aria-valuemin={1}
              aria-valuemax={TOTAL_ETAPAS}
            >
              {Array.from({ length: TOTAL_ETAPAS }).map((_, index) => (
                <div
                  key={index}
                  className={`etapaRev-progresso-item${index < etapaAtual ? ' concluido' : ''}`}
                />
              ))}
            </div>

            <span className="etapaRev-indicador">
              ETAPA {NUMERO_ETAPA} DE {TOTAL_ETAPAS} · ÚLTIMA
            </span>

            <h1>
              Revisão e <span>dossiê</span>
            </h1>

            <p className="etapaRev-subtitulo">
              Confira tudo uma última vez. Depois, baixe o dossiê e siga o guia
              para enviar o pedido pelo SISEN.
            </p>

            <section className="etapaRev-card">
              {situacao === 'carregando' && (
                <p className="etapaRev-estado">Conferindo os seus dados...</p>
              )}

              {situacao === 'sem-processo' && (
                <p className="etapaRev-estado">
                  Você ainda não iniciou um processo. Volte à trilha para começar.
                </p>
              )}

              {situacao === 'erro' && (
                <div className="etapaRev-estado" role="alert">
                  Não foi possível carregar os dados do seu processo.
                  <button type="button" className="etapaRev-editar" onClick={tentarNovamente}>
                    Tentar de novo
                  </button>
                </div>
              )}

              {situacao === 'ok' && (
                <ul className="etapaRev-linhas">
                  {linhas.map((linha) => {
                    const rotuloNumero = linha.chave === 'perfil' ? '' : `${++numero} · `;
                    return (
                      <li key={linha.chave} className="etapaRev-linha">
                        <span
                          className={`etapaRev-icone ${linha.ok ? 'ok' : 'pendente'}`}
                          aria-hidden="true"
                        >
                          {linha.ok ? <IconeCheck /> : '!'}
                        </span>

                        <div className="etapaRev-linha-texto">
                          <strong>
                            {rotuloNumero}
                            {linha.titulo}
                          </strong>
                          <span className={linha.ok ? undefined : 'pendente'}>
                            {linha.detalhe}
                          </span>
                        </div>

                        {linha.chave !== 'perfil' && aoEditar && (
                          <button
                            type="button"
                            className="etapaRev-editar"
                            onClick={() => aoEditar(linha.chave as ChaveEtapa)}
                          >
                            Editar
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              <label className="etapaRev-declaracao">
                <input
                  type="checkbox"
                  checked={declarou}
                  onChange={(event) => setDeclarou(event.target.checked)}
                />
                <span>
                  Declaro que as informações e os documentos são verdadeiros e estão atualizados.
                </span>
              </label>
            </section>

            <section className={`etapaRev-dossie${tudoOk ? ' pronto' : ''}`}>
              <div className="etapaRev-dossie-cabecalho">
                <h2>
                  {tudoOk && (
                    <span className="etapaRev-icone ok" aria-hidden="true">
                      <IconeCheck />
                    </span>
                  )}
                  {tudoOk ? 'Seu dossiê está pronto' : 'Seu dossiê ainda não está pronto'}
                </h2>
                <span className="etapaRev-selo-formato">PDF único</span>
              </div>

              <p>{dicaDossie}</p>

              <div className="etapaRev-dossie-botoes">
                <button
                  type="button"
                  className="primario"
                  disabled={!podeBaixar}
                  onClick={() => void baixar('pdf')}
                >
                  {baixando === 'pdf' ? 'Baixando...' : 'Baixar dossiê (PDF)'}
                </button>
                <button
                  type="button"
                  className="secundario"
                  disabled={!podeBaixar}
                  onClick={() => void baixar('zip')}
                >
                  {baixando === 'zip' ? 'Baixando...' : 'Baixar arquivos separados (.zip)'}
                </button>
              </div>
            </section>
          </section>

          <aside className="etapaRev-lateral">
            <section className="etapaRev-lateral-card">
              <h3>Como enviar pelo SISEN</h3>

              <ol className="etapaRev-passos">
                {PASSOS_SISEN.map((passo, index) => (
                  <li key={passo}>
                    <span aria-hidden="true">{index + 1}</span>
                    {passo}
                  </li>
                ))}
              </ol>

              <a
                className="etapaRev-link-sisen"
                href={URL_SISEN}
                target="_blank"
                rel="noreferrer"
              >
                Abrir o SISEN <span aria-hidden="true">↗</span>
              </a>
            </section>

            <section className="etapaRev-lateral-card">
              <h3>Depois do envio</h3>

              <ul className="etapaRev-depois">
                <li>
                  <span className="etapaRev-selo">3d</span>
                  A análise costuma levar até 3 dias.
                </li>
                <li>
                  <span className="etapaRev-selo">
                    <IconeCheck tamanho={9} />
                  </span>
                  A autorização é emitida no próprio SISEN; acompanhe por lá.
                </li>
                <li>
                  <span className="etapaRev-selo">270d</span>
                  Aprovado, a autorização vale 270 dias para comprar o carro.
                </li>
              </ul>
            </section>

            <section className={`etapaRev-enviar${enviadoEm ? ' enviado' : ''}`}>
              {enviadoEm ? (
                <>
                  <strong>
                    <IconeCheck tamanho={13} /> Marcado como enviado
                  </strong>
                  <button type="button" className="etapaRev-desfazer" onClick={desfazerEnvio}>
                    Desfazer
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={marcarEnviado}>
                    Marcar como enviado
                  </button>
                  <span>
                    Opcional: só para você se organizar. O SISEN não é conectado a este site.
                  </span>
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    </PainelLayout>
  );
}