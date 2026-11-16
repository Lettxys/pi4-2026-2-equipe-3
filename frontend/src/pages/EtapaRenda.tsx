import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';
import {
  buscarChecklistDocumentos,
  buscarUsuarioLogado,
  enviarDocumento,
  extrairMensagemDeErro,
  temToken,
  validarEtapa,
} from '../services/api';
import {
  listarDocumentosDaEtapa,
  paraArquivo,
  salvarDocumento,
} from '../services/documentosSalvos';
import { marcarEtapaConcluida } from '../services/progressoEtapas';
import { montarPerfil, proximaEtapaComTela } from '../services/regrasPerfil';
import type { ChaveEtapaPerfil } from '../services/regrasPerfil';
import { lerRespostasAtivas } from '../services/respostasPerfil';

import './EtapaRenda.css';
import './EtapaConcluida.css';

interface EtapaRendaProps {
  aoSair: () => void | Promise<void>;
  voltarTrilha: () => void;
  aoConcluir?: () => void;
  aoComecarEtapa2?: (chave?: ChaveEtapaPerfil) => void;
  aoEtapaConcluida?: () => void;
  aoNavegar?: (destino: DestinoMenu) => void;
}

const NUMERO_ETAPA = 4;
const TOTAL_ETAPAS = 6;

const ETAPA_BACKEND = 5;
const TIPO_DECLARACAO = 'FINANCIAL_DECLARATION';

const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;
const EXTENSOES_ACEITAS = ['.pdf', '.jpg', '.jpeg', '.png'];

const ETAPA_DOCUMENTOS = 'renda';
const TITULO_ETAPA_DOCUMENTOS = 'Renda e acesso gov.br';
const ID_DOCUMENTO = 'declaracao-ir';
const TITULO_DOCUMENTO = 'Declaração do Imposto de Renda';

const NIVEIS_GOV = [
  { valor: 'bronze', texto: 'Bronze' },
  { valor: 'prata', texto: 'Prata' },
  { valor: 'ouro', texto: 'Ouro' },
  { valor: 'nao-tem', texto: 'Não tenho conta' },
] as const;

type NivelGov = (typeof NIVEIS_GOV)[number]['valor'];

function dataDeHoje(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function IconeCheck() {
  return (
    <svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M0.879883 4.08L4.47988 7.68001L11.2799 0.880005"
        strokeWidth="1.76"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}

function IconeCheckCirculo() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M6 10.5L9 13.5L14.5 7.5M1 10C1 5.0293 5.0293 1 10 1C14.9707 1 19 5.0293 19 10C19 14.9707 14.9707 19 10 19C5.0293 19 1 14.9707 1 10Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}

function IconeCadeado() {
  return (
    <svg width="14" height="16" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M4 8H1V20H17V8H14M4 8H14M4 8V4C4 0 14 0 14 4V8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}

function IconeUpload() {
  return (
    <svg width="18" height="18" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M11.4751 15.225V1.72498M5.4751 6.97498L11.4751 0.974976L17.4751 6.97498M0.975098 15.225V21.225H21.9751V15.225"
        strokeWidth="1.95"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}

function IconeCheckGrande() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeSetaDireita() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 8h12M9 3l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeSeta() {
  return (
    <svg width="16" height="12" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M17 7H1M7 1L1 7L7 13"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}

export default function EtapaRenda({
  aoSair,
  voltarTrilha,
  aoConcluir,
  aoComecarEtapa2,
  aoEtapaConcluida,
  aoNavegar,
}: EtapaRendaProps) {
  const anoAtual = new Date().getFullYear() - 1;
  const totalAnos = 5;
  const anos = Array.from({ length: totalAnos }, (_, i) => anoAtual - i);

  const [financiamento, setFinanciamento] = useState<'sim' | 'avista'>('avista');
  const [ano, setAno] = useState(anoAtual);
  const [nivelGov, setNivelGov] = useState<NivelGov>('prata');
  const [confirmouDados, setConfirmouDados] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [arquivoSalvo, setArquivoSalvo] = useState<File | null>(null);
  const [etapaConcluida, setEtapaConcluida] = useState(false);
  const [respostas] = useState(lerRespostasAtivas);
  const botaoProximaEtapa = useRef<HTMLButtonElement | null>(null);

  const etapasDoPerfil = montarPerfil(respostas ?? {}).etapas;
  const posicaoNoPerfil = etapasDoPerfil.findIndex(
    (etapa) => etapa.chave === ETAPA_DOCUMENTOS
  );
  const numeroEtapa = posicaoNoPerfil >= 0 ? posicaoNoPerfil + 1 : NUMERO_ETAPA;
  const totalEtapas = etapasDoPerfil.length > 0 ? etapasDoPerfil.length : TOTAL_ETAPAS;
  const proxima = proximaEtapaComTela(etapasDoPerfil, ETAPA_DOCUMENTOS);
  const numeroProxima = proxima ? proxima.numero : numeroEtapa + 1;
  const tituloProxima = proxima ? proxima.etapa.titulo : '';

  const [processId, setProcessId] = useState<number | null>(null);
  const [declaracaoBackend, setDeclaracaoBackend] = useState(false);
  const [declaracaoRejeitada, setDeclaracaoRejeitada] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarDoBackend() {
      if (!temToken()) return;
      try {
        const eu = await buscarUsuarioLogado();
        if (!eu.activeProcessId) return;

        const checklist = await buscarChecklistDocumentos(eu.activeProcessId).catch(
          () => null
        );
        if (!ativo) return;

        setProcessId(eu.activeProcessId);

        const declaracao = checklist?.find(
          (item) => item.documentType === TIPO_DECLARACAO
        );
        const rejeitada =
          declaracao?.status === 'REJECTED' || declaracao?.status === 'EXPIRED';

        setDeclaracaoRejeitada(Boolean(declaracao?.isUploaded && rejeitada));
        setDeclaracaoBackend(Boolean(declaracao?.isUploaded && !rejeitada));
      } catch {
        return;
      }
    }

    void carregarDoBackend();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    void listarDocumentosDaEtapa(ETAPA_DOCUMENTOS).then((lista) => {
      const salvo = lista.find((documento) => documento.documentoId === ID_DOCUMENTO);
      if (ativo && salvo) {
        setArquivoSalvo(paraArquivo(salvo));
      }
    });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!etapaConcluida) return;

    botaoProximaEtapa.current?.focus();

    function aoTeclar(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setEtapaConcluida(false);
      }
    }

    window.addEventListener('keydown', aoTeclar);

    return () => {
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [etapaConcluida]);

  const declaracaoEnviada =
    !declaracaoRejeitada && (declaracaoBackend || Boolean(arquivoSalvo));
  const rendaOk =
    financiamento === 'sim' || Boolean(arquivo) || declaracaoEnviada;
  const arquivoExibido = arquivo ?? (declaracaoEnviada ? arquivoSalvo : null);
  const mostrarLinha = Boolean(arquivo) || declaracaoEnviada;
  const govOk = nivelGov !== 'nao-tem' && confirmouDados;
  const podeConcluir = rendaOk && govOk;

  const concluidas = Number(rendaOk) + Number(govOk);
  const porcentagem = concluidas * 50;

  function limparFeedback() {
    setEtapaConcluida(false);
    setErro('');
  }

  function receberArquivo(selecionado: File | undefined) {
    if (!selecionado) return;

    const nome = selecionado.name.toLowerCase();
    if (!EXTENSOES_ACEITAS.some((extensao) => nome.endsWith(extensao))) {
      setErro('Formato não aceito. Envie um PDF, JPG ou PNG.');
      return;
    }

    if (selecionado.size > TAMANHO_MAXIMO_BYTES) {
      setErro('Arquivo acima do limite de 10 MB.');
      return;
    }

    setArquivo(selecionado);
    limparFeedback();
  }

  function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const selecionado = event.target.files?.[0];
    event.target.value = '';
    receberArquivo(selecionado);
  }

  function verArquivo() {
    if (!arquivoExibido) return;
    const url = URL.createObjectURL(arquivoExibido);
    window.open(url, '_blank', 'noopener');
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function soltarArquivo(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setArrastando(false);
    if (enviando) return;
    receberArquivo(event.dataTransfer.files?.[0]);
  }

  async function concluirEtapa() {
    if (!podeConcluir || enviando) return;

    setEnviando(true);
    setErro('');

    try {
      if (financiamento === 'avista' && arquivo) {
        if (processId) {
          await enviarDocumento(processId, {
            file: arquivo,
            documentType: TIPO_DECLARACAO,
            issuedAt: dataDeHoje(),
          });
          setDeclaracaoBackend(true);
        }

        await salvarDocumento({
          etapa: ETAPA_DOCUMENTOS,
          etapaTitulo: TITULO_ETAPA_DOCUMENTOS,
          documentoId: ID_DOCUMENTO,
          titulo: TITULO_DOCUMENTO,
          arquivo,
        });
        setArquivoSalvo(arquivo);
        setArquivo(null);
        setDeclaracaoRejeitada(false);
      }

      if (processId) {
        const resultado = await validarEtapa(
          processId,
          ETAPA_BACKEND,
          financiamento === 'sim'
        );

        if (!resultado.isValidated) {
          const mensagens = Array.from(
            new Set(resultado.validationErrors.map((item) => item.message))
          );
          setErro(
            mensagens.length > 0
              ? `A etapa ainda tem pendências: ${mensagens.join(' ')}`
              : 'Não foi possível validar a etapa.'
          );
          return;
        }
      }

      marcarEtapaConcluida(ETAPA_DOCUMENTOS);
      aoEtapaConcluida?.();
      setEtapaConcluida(true);
    } catch (error) {
      setErro(
        extrairMensagemDeErro(error, 'Não foi possível concluir a etapa. Tente novamente.')
      );
    } finally {
      setEnviando(false);
    }
  }

  function irParaTrilha() {
    setEtapaConcluida(false);
    (aoConcluir ?? voltarTrilha)();
  }

  function comecarProximaEtapa() {
    setEtapaConcluida(false);

    if (proxima && aoComecarEtapa2) {
      aoComecarEtapa2(proxima.etapa.chave);
      return;
    }

    (aoConcluir ?? voltarTrilha)();
  }

  const mensagemPendente = erro
    ? erro
    : !rendaOk
      ? 'Falta a declaração do Imposto de Renda'
      : nivelGov === 'nao-tem'
        ? 'Crie sua conta gov.br para continuar'
        : !confirmouDados
          ? 'Confirme seu acesso ao gov.br'
          : 'Tudo pronto para continuar';

  const rotuloRenda =
    financiamento === 'sim'
      ? 'Dispensada'
      : declaracaoEnviada
        ? 'Enviado'
        : arquivo
          ? 'Pronto para enviar'
          : 'Pendente';

  return (
    <PainelLayout
      aoSair={aoSair}
      aoNavegar={aoNavegar}
      itemAtivo="processo"
      caminho={['Meu processo', `Etapa ${numeroEtapa} · Renda e gov.br`]}
    >
      <div className="etapaRenda-layout">
        <div className="etapaRenda-conteudo">
          <div className="etapaRenda-principal">
            <button type="button" className="etapaRenda-voltar" onClick={voltarTrilha}>
              <IconeSeta /> Voltar para a trilha
            </button>

            <div
              className="etapaRenda-progresso-etapas"
              role="progressbar"
              aria-label="Etapas do processo"
              aria-valuenow={numeroEtapa}
              aria-valuemin={1}
              aria-valuemax={totalEtapas}
            >
              {Array.from({ length: totalEtapas }).map((_, index) => (
                <div
                  key={index}
                  className={`etapaRenda-progresso-item${index < numeroEtapa ? ' concluido' : ''}`}
                />
              ))}
            </div>

            <span className="etapaRenda-indicador">
              ETAPA {numeroEtapa} DE {totalEtapas}
            </span>

            <h1>
              Renda e <span>acesso gov.br</span>
            </h1>

            <p className="etapaRenda-subtitulo">
              Aqui algumas respostas dispensam documentos. Responda primeiro e
              mostraremos só o que você precisa.
            </p>

            <div className="etapaRenda-progresso-interno">
              <strong>{concluidas} de 2 concluídos</strong>
              <div
                className="etapaRenda-barra"
                role="progressbar"
                aria-valuenow={porcentagem}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div style={{ width: `${porcentagem}%` }} />
              </div>
              <span>{porcentagem}%</span>
            </div>

            <section className="etapaRenda-card">
              <div className="etapaRenda-card-cabecalho">
                <div>
                  <h2>Declaração do Imposto de Renda</h2>
                  <p>
                    A Receita confere se a renda é compatível com o valor do
                    carro. Se você for financiar, a declaração é dispensada.
                  </p>
                </div>
                <span className={`etapaRenda-status${rendaOk ? ' status-ok' : ''}`}>
                  {rotuloRenda}
                </span>
              </div>

              <div className="etapaRenda-pergunta">
                <strong>Você vai financiar o veículo?</strong>
                <div className="etapaRenda-opcoes">
                  <button
                    type="button"
                    className={financiamento === 'sim' ? 'selecionado' : ''}
                    onClick={() => {
                      setFinanciamento('sim');
                      limparFeedback();
                    }}
                  >
                    Sim, vou financiar{financiamento === 'sim' && <IconeCheck />}
                  </button>
                  <button
                    type="button"
                    className={financiamento === 'avista' ? 'selecionado' : ''}
                    onClick={() => {
                      setFinanciamento('avista');
                      limparFeedback();
                    }}
                  >
                    Não, vou pagar à vista{financiamento === 'avista' && <IconeCheck />}
                  </button>
                </div>
              </div>

              {financiamento === 'avista' ? (
                <div className="etapaRenda-upload-linha">
                  <div className="etapaRenda-upload-bloco">
                    <input
                      ref={inputArquivo}
                      id="arquivo-declaracao"
                      className="etapaRenda-input-oculto"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={selecionarArquivo}
                      disabled={enviando}
                    />
                    {mostrarLinha ? (
                      <div className="etapaRenda-arquivo">
                        <IconeCheckCirculo />
                        <span className="etapaRenda-arquivo-nome">
                          {arquivoExibido
                            ? `${arquivoExibido.name} · ${formatarTamanho(arquivoExibido.size)}`
                            : 'Declaração já enviada'}
                        </span>
                        <div className="etapaRenda-arquivo-acoes">
                          {arquivoExibido && (
                            <button type="button" onClick={verArquivo}>
                              Ver
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => inputArquivo.current?.click()}
                            disabled={enviando}
                          >
                            Substituir
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="arquivo-declaracao"
                        className={`etapaRenda-upload${arrastando ? ' arrastando' : ''}`}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setArrastando(true);
                        }}
                        onDragLeave={() => setArrastando(false)}
                        onDrop={soltarArquivo}
                      >
                        <span className="etapaRenda-upload-icone">
                          <IconeUpload />
                        </span>
                        <span>
                          {declaracaoRejeitada ? (
                            <>
                              <strong>A declaração enviada foi recusada ou venceu.</strong>{' '}
                              Selecione um novo arquivo.
                            </>
                          ) : (
                            <>
                              Arraste a declaração e o recibo ou{' '}
                              <strong>selecione do computador</strong>
                            </>
                          )}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="etapaRenda-ano">
                    <label htmlFor="ano-calendario">Ano-calendário</label>
                    <select
                      id="ano-calendario"
                      value={ano}
                      onChange={(event) => setAno(Number(event.target.value))}
                    >
                      {anos.map((opcaoAno) => (
                        <option key={opcaoAno} value={opcaoAno}>
                          {opcaoAno}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="etapaRenda-dica">
                  <IconeCheck />
                  Como você vai financiar o veículo, a declaração de Imposto de
                  Renda não é necessária nesta etapa.
                </div>
              )}
            </section>

            <section className="etapaRenda-card etapaRenda-card-gov">
              <div className="etapaRenda-card-cabecalho">
                <div>
                  <h2>Conta gov.br</h2>
                  <p>
                    Não precisa enviar arquivo: você vai usar o gov.br para
                    entrar no SISEN e enviar o pedido.
                  </p>
                </div>
                <span className={`etapaRenda-status${govOk ? ' status-ok' : ''}`}>
                  {govOk ? (
                    <>
                      <IconeCheck />
                      Confirmado
                    </>
                  ) : (
                    'Pendente'
                  )}
                </span>
              </div>

              <div className="etapaRenda-pergunta">
                <strong>Qual é o nível da sua conta?</strong>
                <div className="etapaRenda-opcoes etapaRenda-opcoes-gov">
                  {NIVEIS_GOV.map((opcao) => (
                    <button
                      type="button"
                      key={opcao.valor}
                      className={nivelGov === opcao.valor ? 'selecionado' : ''}
                      onClick={() => {
                        setNivelGov(opcao.valor);
                        limparFeedback();
                      }}
                    >
                      {opcao.texto}
                      {nivelGov === opcao.valor && <IconeCheck />}
                    </button>
                  ))}
                </div>
              </div>

              {nivelGov === 'nao-tem' ? (
                <div className="etapaRenda-aviso">
                  Você precisa criar uma conta gov.br para continuar.
                  <a
                    href="https://www.gov.br/governodigital/pt-br/identidade/conta-gov-br"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Criar conta gov.br
                  </a>
                </div>
              ) : (
                <>
                  <div className="etapaRenda-dica">
                    Bronze já basta para o SISEN. Ouro agiliza algumas verificações, mas não é obrigatório.
                  </div>
                  <label className="etapaRenda-checkbox">
                    <input
                      type="checkbox"
                      checked={confirmouDados}
                      onChange={(event) => {
                        setConfirmouDados(event.target.checked);
                        limparFeedback();
                      }}
                    />
                    <span>Confirmo que consigo entrar no gov.br com o meu CPF.</span>
                  </label>
                </>
              )}
            </section>
          </div>

          <aside className="etapaRenda-lateral">
            <section className="etapaRenda-info-card">
              <h3>Por que essa etapa?</h3>
              <p>
                <IconeCheckCirculo />
                A Receita verifica se a renda ou o patrimônio é compatível com o valor do veículo.
              </p>
              <p>
                <IconeCheckCirculo />
                O pedido é feito no SISEN, que só aceita login pelo gov.br.
              </p>
            </section>

            <section className="etapaRenda-ajuda-card">
              <h3>Não tem conta gov.br?</h3>
              <p>
                Marque "Não tenho conta" e mostraremos o passo a passo para
                criar a sua pelo app ou site gov.br.
              </p>
            </section>

            <section className="etapaRenda-concluir-card">
              <h3>Concluir etapa</h3>
              <button
                type="button"
                disabled={!podeConcluir || enviando}
                onClick={() => void concluirEtapa()}
              >
                {enviando ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    {!podeConcluir && <IconeCadeado />}
                    <span>Concluir etapa {numeroEtapa}</span>
                  </>
                )}
              </button>
              <span
                className={erro ? 'etapaRenda-erro' : undefined}
                role={erro ? 'alert' : undefined}
              >
                {mensagemPendente}
              </span>
            </section>
          </aside>
        </div>
      </div>
      {etapaConcluida && (
        <div
          className="etapa-concluida-overlay"
          onClick={() => setEtapaConcluida(false)}
        >
          <section
            className="etapa-concluida-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="etapa-concluida-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="etapa-concluida-icone">
              <IconeCheckGrande />
            </span>

            <h2 id="etapa-concluida-titulo">Etapa {numeroEtapa} concluída!</h2>

            <p className="etapa-concluida-texto">
              Sua renda e seu acesso gov.br foram confirmados.
              <br />
              <strong>
                Etapa {numeroProxima}
                {tituloProxima ? ` · ${tituloProxima}` : ''}
              </strong>{' '}
              liberada.
            </p>

            <div className="etapa-concluida-passos" aria-hidden="true">
              {Array.from({ length: totalEtapas }, (_, indice) => (
                <span
                  key={indice}
                  className={
                    indice < numeroEtapa
                      ? 'ativo'
                      : indice === numeroEtapa
                        ? 'proxima'
                        : ''
                  }
                />
              ))}
            </div>

            <div className="etapa-concluida-acoes">
              <button
                ref={botaoProximaEtapa}
                type="button"
                className="etapa-concluida-primario"
                onClick={comecarProximaEtapa}
              >
                Começar etapa {numeroProxima}
                <IconeSetaDireita />
              </button>

              <button
                type="button"
                className="etapa-concluida-secundario"
                onClick={irParaTrilha}
              >
                Voltar à trilha
              </button>
            </div>
          </section>
        </div>
      )}
    </PainelLayout>
  );
}