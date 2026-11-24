import { useEffect, useMemo, useRef, useState } from 'react';

import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';
import { listarDocumentos } from '../services/documentosSalvos';
import type { DocumentoSalvo } from '../services/documentosSalvos';
import {
  baixarArquivo,
  gerarDossiePdf,
  gerarDossieZip,
} from '../services/dossie';
import type { GrupoDossie } from '../services/dossie';
import { lerEtapasConcluidas } from '../services/progressoEtapas';
import { ETAPAS_COM_TELA, montarPerfil } from '../services/regrasPerfil';
import type { ChaveEtapaPerfil } from '../services/regrasPerfil';
import {
  lerRespostasAtivas,
  lerUsuarioAtivo,
} from '../services/respostasPerfil';

import './EtapaRevisao.css';

type FormatoDossie = 'pdf' | 'zip';
type StatusLinha = 'ok' | 'pendente' | 'indisponivel';

interface EtapaRevisaoProps {
  aoSair: () => void | Promise<void>;
  voltarTrilha: () => void;
  aoNavegar?: (destino: DestinoMenu) => void;
  aoEditar?: (chave: ChaveEtapaPerfil) => void;
  aoEtapaConcluida?: () => void;
}

interface Linha {
  chave: ChaveEtapaPerfil;
  numero: number;
  titulo: string;
  detalhe: string;
  status: StatusLinha;
  documentos: DocumentoSalvo[];
}

interface Toast {
  texto: string;
  tipo: 'sucesso' | 'aviso';
}

const URL_SISEN =
  'https://www.gov.br/pt-br/servicos/obter-isencao-de-impostos-para-comprar-carro';
const TEMPO_TOAST = 4000;
const CHAVE_VEICULO = 'veiculo-rascunho';
const CHAVE_ENVIADO = 'revisao-enviado';

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

function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function chavesEquivalentes(chave: ChaveEtapaPerfil): ChaveEtapaPerfil[] {
  return chave === 'obter-laudo' ? ['obter-laudo', 'documentos-medicos'] : [chave];
}

function lerEnviadoEm(usuarioId: number | null): string | null {
  if (usuarioId === null) return null;

  try {
    return localStorage.getItem(`${CHAVE_ENVIADO}:${usuarioId}`);
  } catch {
    return null;
  }
}

function resumirVeiculo(usuarioId: number | null): string | null {
  if (usuarioId === null) return null;

  try {
    const bruto = localStorage.getItem(`${CHAVE_VEICULO}:${usuarioId}`);

    if (!bruto) return null;

    const dados = JSON.parse(bruto) as Record<string, unknown>;
    const texto = (campo: string) =>
      typeof dados[campo] === 'string' ? (dados[campo] as string) : '';

    const marca = texto('marca');
    const modelo = texto('modelo').trim();
    const valor = texto('valorTabela');

    if (!marca || !modelo) return null;

    return `${marca} ${modelo}${valor ? ` · ${valor}` : ''}`;
  } catch {
    return null;
  }
}

function IconeCheck({ tamanho = 12 }: { tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={Math.round(tamanho * 0.83)}
      viewBox="0 0 12 10"
      fill="none"
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

function IconeSeta() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M14 8H2M7 3 2 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function EtapaRevisao({
  aoSair,
  voltarTrilha,
  aoNavegar,
  aoEditar,
  aoEtapaConcluida,
}: EtapaRevisaoProps) {
  const [respostas] = useState(lerRespostasAtivas);
  const [concluidas] = useState(lerEtapasConcluidas);
  const [usuarioId] = useState(lerUsuarioAtivo);
  const [documentos, setDocumentos] = useState<DocumentoSalvo[] | null>(null);
  const [declarou, setDeclarou] = useState(false);
  const [baixando, setBaixando] = useState<FormatoDossie | null>(null);
  const [enviadoEm, setEnviadoEm] = useState<string | null>(() =>
    lerEnviadoEm(lerUsuarioAtivo())
  );
  const [toast, setToast] = useState<Toast | null>(null);
  const temporizadorToast = useRef<number | undefined>(undefined);

  useEffect(() => {
    let ativo = true;

    void listarDocumentos().then((lista) => {
      if (ativo) setDocumentos(lista);
    });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(temporizadorToast.current);
  }, []);

  const perfil = useMemo(() => montarPerfil(respostas ?? {}), [respostas]);

  const totalEtapas = perfil.etapas.length;
  const posicaoRevisao = perfil.etapas.findIndex((etapa) => etapa.chave === 'revisao');
  const numeroEtapa = posicaoRevisao >= 0 ? posicaoRevisao + 1 : totalEtapas;

  const linhas = useMemo<Linha[]>(() => {
    const detalheVeiculo = resumirVeiculo(usuarioId);

    return perfil.etapas
      .filter((etapa) => etapa.chave !== 'revisao')
      .map((etapa, indice) => {
        const equivalentes = chavesEquivalentes(etapa.chave);
        const docs = (documentos ?? [])
          .filter((documento) =>
            equivalentes.includes(documento.etapa as ChaveEtapaPerfil)
          )
          .sort((a, b) => a.enviadoEm.localeCompare(b.enviadoEm));

        const temTela = ETAPAS_COM_TELA.includes(etapa.chave);
        const concluida = equivalentes.some((chave) => concluidas.includes(chave));

        let status: StatusLinha;
        let detalhe: string;

        if (!temTela) {
          status = 'indisponivel';
          detalhe = 'Etapa ainda não disponível no sistema';
        } else if (concluida) {
          status = 'ok';
          detalhe =
            etapa.chave === 'veiculo' && detalheVeiculo
              ? detalheVeiculo
              : docs.length > 0
                ? plural(docs.length, 'documento conferido', 'documentos conferidos')
                : 'Etapa concluída';
        } else {
          status = 'pendente';
          detalhe =
            docs.length > 0
              ? `Etapa não concluída · ${plural(docs.length, 'documento enviado', 'documentos enviados')}`
              : 'Etapa ainda não concluída';
        }

        return {
          chave: etapa.chave,
          numero: indice + 1,
          titulo: etapa.titulo,
          detalhe,
          status,
          documentos: docs,
        };
      });
  }, [perfil, documentos, concluidas, usuarioId]);

  const grupos = useMemo<GrupoDossie[]>(
    () =>
      linhas
        .filter((linha) => linha.documentos.length > 0)
        .map((linha) => ({
          numero: linha.numero,
          titulo: linha.titulo,
          documentos: linha.documentos,
        })),
    [linhas]
  );

  const totalArquivos = grupos.reduce((soma, grupo) => soma + grupo.documentos.length, 0);
  const totalBytes = grupos.reduce(
    (soma, grupo) =>
      soma + grupo.documentos.reduce((parcial, documento) => parcial + documento.tamanho, 0),
    0
  );

  const pendentes = linhas.filter((linha) => linha.status === 'pendente').length;
  const carregando = documentos === null;
  const tudoOk = !carregando && pendentes === 0;
  const podeBaixar = tudoOk && declarou && baixando === null;

  function mostrarToast(texto: string, tipo: Toast['tipo']) {
    window.clearTimeout(temporizadorToast.current);
    setToast({ texto, tipo });
    temporizadorToast.current = window.setTimeout(() => setToast(null), TEMPO_TOAST);
  }

  async function baixar(formato: FormatoDossie) {
    if (!podeBaixar) return;

    setBaixando(formato);

    try {
      if (formato === 'pdf') {
        const { blob, ignorados } = await gerarDossiePdf({
          perfil: perfil.tags.join(' · '),
          geradoEm: new Date(),
          linhas: linhas.map((linha) => ({
            numero: linha.numero,
            titulo: linha.titulo,
            detalhe: linha.detalhe,
          })),
          grupos,
        });

        baixarArquivo(blob, 'dossie-isenta.pdf');

        if (ignorados.length > 0) {
          mostrarToast(
            `Dossiê baixado, mas ${plural(ignorados.length, 'arquivo não pôde', 'arquivos não puderam')} ser incluído.`,
            'aviso'
          );
        } else {
          mostrarToast('Dossiê baixado.', 'sucesso');
        }
      } else {
        const blob = await gerarDossieZip(grupos);
        baixarArquivo(blob, 'documentos-isenta.zip');
        mostrarToast('Arquivos baixados.', 'sucesso');
      }

      aoEtapaConcluida?.();
    } catch (erro) {
      console.error('[Dossiê]', erro);
      mostrarToast('Não foi possível gerar o dossiê. Tente novamente.', 'aviso');
    } finally {
      setBaixando(null);
    }
  }

  function marcarEnviado() {
    const agora = new Date().toISOString();

    setEnviadoEm(agora);

    if (usuarioId !== null) {
      try {
        localStorage.setItem(`${CHAVE_ENVIADO}:${usuarioId}`, agora);
      } catch {
        return;
      }
    }

    aoEtapaConcluida?.();
    mostrarToast('Pedido marcado como enviado. Boa sorte!', 'sucesso');
  }

  function desfazerEnvio() {
    setEnviadoEm(null);

    if (usuarioId !== null) {
      try {
        localStorage.removeItem(`${CHAVE_ENVIADO}:${usuarioId}`);
      } catch {
        return;
      }
    }
  }

  const dicaDossie = carregando
    ? 'Aguarde a conferência dos dados.'
    : !tudoOk
      ? `Resolva ${plural(pendentes, 'item pendente', 'itens pendentes')} acima para liberar o dossiê.`
      : !declarou
        ? 'Marque a declaração acima para liberar o download.'
        : 'Um PDF com o resumo dos dados e todos os documentos, na ordem pedida pelo SISEN.';

  return (
    <PainelLayout
      aoSair={aoSair}
      aoNavegar={aoNavegar}
      itemAtivo="processo"
      caminho={['Meu processo', `Etapa ${numeroEtapa} · Revisão e dossiê`]}
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
              <IconeSeta />
              Voltar para a trilha
            </button>

            <div
              className="etapaRev-progresso-etapas"
              style={{ gridTemplateColumns: `repeat(${totalEtapas}, 1fr)` }}
              role="progressbar"
              aria-label="Etapas do processo"
              aria-valuenow={numeroEtapa}
              aria-valuemin={1}
              aria-valuemax={totalEtapas}
            >
              {Array.from({ length: totalEtapas }).map((_, indice) => (
                <div
                  key={indice}
                  className={`etapaRev-progresso-item${
                    indice < numeroEtapa ? ' concluido' : ''
                  }`}
                />
              ))}
            </div>

            <span className="etapaRev-indicador">
              ETAPA {numeroEtapa} DE {totalEtapas} · ÚLTIMA
            </span>

            <h1>
              Revisão e <span>dossiê</span>
            </h1>

            <p className="etapaRev-subtitulo">
              Confira tudo uma última vez. Depois, baixe o dossiê e siga o guia
              para enviar o pedido pelo SISEN.
            </p>

            <section className="etapaRev-card">
              {carregando ? (
                <p className="etapaRev-estado">Conferindo os seus dados...</p>
              ) : (
                <ul className="etapaRev-linhas">
                  <li className="etapaRev-linha">
                    <span className="etapaRev-icone ok" aria-hidden="true">
                      <IconeCheck />
                    </span>

                    <div className="etapaRev-linha-texto">
                      <strong>Perfil</strong>
                      <span>{perfil.tags.join(' · ')}</span>
                    </div>
                  </li>

                  {linhas.map((linha) => (
                    <li key={linha.chave} className="etapaRev-linha">
                      <span
                        className={`etapaRev-icone ${
                          linha.status === 'ok'
                            ? 'ok'
                            : linha.status === 'pendente'
                              ? 'pendente'
                              : 'neutro'
                        }`}
                        aria-hidden="true"
                      >
                        {linha.status === 'ok' ? (
                          <IconeCheck />
                        ) : linha.status === 'pendente' ? (
                          '!'
                        ) : (
                          '–'
                        )}
                      </span>

                      <div className="etapaRev-linha-texto">
                        <strong>
                          {linha.numero} · {linha.titulo}
                        </strong>
                        <span className={linha.status === 'pendente' ? 'pendente' : undefined}>
                          {linha.detalhe}
                        </span>
                      </div>

                      {linha.status !== 'indisponivel' && aoEditar && (
                        <button
                          type="button"
                          className="etapaRev-editar"
                          onClick={() => aoEditar(linha.chave)}
                        >
                          {linha.status === 'pendente' ? 'Concluir' : 'Editar'}
                        </button>
                      )}
                    </li>
                  ))}
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

                <span className="etapaRev-selo-formato">
                  {tudoOk
                    ? `${plural(totalArquivos, 'arquivo', 'arquivos')} · ${formatarTamanho(totalBytes)}`
                    : 'PDF único'}
                </span>
              </div>

              <p>{dicaDossie}</p>

              <div className="etapaRev-dossie-botoes">
                <button
                  type="button"
                  className="primario"
                  disabled={!podeBaixar}
                  onClick={() => void baixar('pdf')}
                >
                  {baixando === 'pdf' ? 'Gerando PDF...' : 'Baixar dossiê (PDF)'}
                </button>

                <button
                  type="button"
                  className="secundario"
                  disabled={!podeBaixar}
                  onClick={() => void baixar('zip')}
                >
                  {baixando === 'zip' ? 'Gerando .zip...' : 'Baixar arquivos separados (.zip)'}
                </button>
              </div>
            </section>
          </section>

          <aside className="etapaRev-lateral">
            <section className="etapaRev-lateral-card">
              <h3>Como enviar pelo SISEN</h3>

              <ol className="etapaRev-passos">
                {PASSOS_SISEN.map((passo, indice) => (
                  <li key={passo}>
                    <span aria-hidden="true">{indice + 1}</span>
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
                  A análise costuma levar cerca de 3 dias úteis.
                </li>
                <li>
                  <span className="etapaRev-selo">30d</span>
                  Se a Receita pedir algo, você tem cerca de 30 dias para responder.
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
                    Opcional: só para você se organizar. O isenta+ não acompanha a análise.
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