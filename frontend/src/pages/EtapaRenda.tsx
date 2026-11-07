import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';
import {
  buscarChecklistDocumentos,
  buscarProgressoProcesso,
  buscarUsuarioLogado,
  enviarDocumento,
  extrairMensagemDeErro,
  temToken,
  validarEtapa,
} from '../services/api';

import './EtapaRenda.css';

interface EtapaRendaProps {
  aoSair: () => void | Promise<void>;
  voltarTrilha: () => void;
  aoConcluir?: () => void;
  aoNavegar?: (destino: DestinoMenu) => void;
}

// Numeração mostrada na tela (trilha do Overview).
const NUMERO_ETAPA = 4;
const TOTAL_ETAPAS = 6;

// Etapa do backend onde vive a FINANCIAL_DECLARATION
// (seed: etapa 5 = "Solicitação de Isenção de ICMS e IPVA").
const ETAPA_BACKEND = 5;
const TIPO_DECLARACAO = 'FINANCIAL_DECLARATION';

const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // mesmo limite do backend
const EXTENSOES_ACEITAS = ['.pdf', '.jpg', '.jpeg', '.png'];

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

function IconeCheck() {
  return (
    <svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0.879883 4.08L4.47988 7.68001L11.2799 0.880005"
        strokeWidth="1.76"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#16A095"
      />
    </svg>
  );
}

function IconeCheckCirculo() {
  return (
    <svg width="10" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 10.5L9 13.5L14.5 7.5M1 10C1 5.0293 5.0293 1 10 1C14.9707 1 19 5.0293 19 10C19 14.9707 14.9707 19 10 19C5.0293 19 1 14.9707 1 10Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#1F9D63"
      />
    </svg>
  );
}

function IconeCadeado() {
  return (
    <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 8H1V20H17V8H14M4 8H14M4 8V4C4 0 14 0 14 4V8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#7D8FA6"
      />
    </svg>
  );
}

export default function EtapaRenda({
  aoSair,
  voltarTrilha,
  aoConcluir,
  aoNavegar,
}: EtapaRendaProps) {
  const [financiamento, setFinanciamento] = useState<'sim' | 'avista'>('avista');
  const anoAtual = new Date().getFullYear() - 1
  const [ano, setAno] = useState(anoAtual);
  const [nivelGov, setNivelGov] = useState<NivelGov>('prata');
  const [confirmouDados, setConfirmouDados] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [etapaConcluida, setEtapaConcluida] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(NUMERO_ETAPA);
  const totalAnos = 5;
  const anos = Array.from({ length: totalAnos }, (_, i) => anoAtual - i);
  // Estado vindo do backend
  const [processId, setProcessId] = useState<number | null>(null);
  const [declaracaoBackend, setDeclaracaoBackend] = useState(false);
  const [declaracaoRejeitada, setDeclaracaoRejeitada] = useState(false);

  // Estado do envio
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregarDoBackend() {
      if (!temToken()) return;
      try {
        const eu = await buscarUsuarioLogado();
        if (!eu.activeProcessId) return;

        const [prog, checklist] = await Promise.all([
          buscarProgressoProcesso(eu.activeProcessId),
          buscarChecklistDocumentos(eu.activeProcessId).catch(() => null),
        ]);
        if (!ativo) return;

        setProcessId(eu.activeProcessId);
        setEtapaAtual(prog.currentStep || NUMERO_ETAPA);

        // Só a declaração financeira conta (antes qualquer documento enviado
        // fazia a tela achar que a declaração já estava lá).
        const declaracao = checklist?.find(
          (item) => item.documentType === TIPO_DECLARACAO
        );
        const rejeitada =
          declaracao?.status === 'REJECTED' || declaracao?.status === 'EXPIRED';

        setDeclaracaoRejeitada(Boolean(declaracao?.isUploaded && rejeitada));
        setDeclaracaoBackend(Boolean(declaracao?.isUploaded && !rejeitada));
      } catch {
        // Fallback silencioso: a tela continua utilizável; o erro real
        // aparece ao tentar concluir.
      }
    }

    void carregarDoBackend();
    return () => {
      ativo = false;
    };
  }, []);

  const rendaOk =
    financiamento === 'sim' || Boolean(arquivo) || declaracaoBackend;
  const govOk = nivelGov !== 'nao-tem' && confirmouDados;
  const podeConcluir = rendaOk && govOk;

  const concluidas = Number(rendaOk) + Number(govOk);
  const porcentagem = concluidas * 50;

  function limparFeedback() {
    setEtapaConcluida(false);
    setErro('');
  }

  function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const selecionado = event.target.files?.[0];
    event.target.value = '';
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

  async function concluirEtapa() {
    if (!podeConcluir || enviando) return;

    if (!processId) {
      setErro('Nenhum processo ativo encontrado. Volte à trilha e inicie seu processo.');
      return;
    }

    setEnviando(true);
    setErro('');

    try {
      // 1) Upload da declaração (só quando paga à vista e escolheu um arquivo)
      if (financiamento === 'avista' && arquivo) {
        await enviarDocumento(processId, {
          file: arquivo,
          documentType: TIPO_DECLARACAO,
          issuedAt: dataDeHoje(),
        });
        setArquivo(null);
        setDeclaracaoBackend(true);
        setDeclaracaoRejeitada(false);
      }

      // 2) Validação da etapa no backend
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

      setEtapaConcluida(true);
      (aoConcluir ?? voltarTrilha)();
    } catch (error) {
      setErro(
        extrairMensagemDeErro(error, 'Não foi possível concluir a etapa. Tente novamente.')
      );
    } finally {
      setEnviando(false);
    }
  }

  const mensagemPendente = erro
    ? erro
    : !rendaOk
      ? 'Envie a declaração do Imposto de Renda'
      : nivelGov === 'nao-tem'
        ? 'Crie sua conta gov.br para continuar'
        : !confirmouDados
          ? 'Confirme seu acesso ao gov.br'
          : 'Tudo pronto para continuar';

  const rotuloRenda =
    financiamento === 'sim'
      ? 'Dispensada'
      : declaracaoBackend
        ? 'Enviado'
        : arquivo
          ? 'Pronto para enviar'
          : 'Pendente';

  return (
    <PainelLayout
      aoSair={aoSair}
      aoNavegar={aoNavegar}
      itemAtivo="processo"
      caminho={['Meu processo', 'Etapa 4 · Renda e gov.br']}
    >
      <div className="etapaRenda-layout">
        <div className="etapaRenda-conteudo">
          <div className="etapaRenda-principal">
            <button type="button" className="etapaRenda-voltar" onClick={voltarTrilha}>
              <span aria-hidden="true">←</span> Voltar para a trilha
            </button>

            <div
              className="etapaRenda-progresso-etapas"
              role="progressbar"
              aria-label="Etapas do processo"
              aria-valuenow={etapaAtual}
              aria-valuemin={1}
              aria-valuemax={TOTAL_ETAPAS}
            >
              {Array.from({ length: TOTAL_ETAPAS }).map((_, index) => (
                <div
                  key={index}
                  className={`etapaRenda-progresso-item${index < etapaAtual ? ' concluido' : ''}`}
                />
              ))}
            </div>

            <span className="etapaRenda-indicador">
              ETAPA {NUMERO_ETAPA} DE {TOTAL_ETAPAS}
            </span>

            <h1>
              Renda e <span>acesso gov.br</span>
            </h1>

            <p className="etapaRenda-subtitulo">
              Aqui algumas respostas disparam documentos. Responda primeiro
              e mostraremos só o que você precisa.
            </p>

            <div className="etapaRenda-progresso-interno">
              <strong>{concluidas} de 2 concluídas</strong>
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
                    A Receita confere se a renda é compatível com o valor
                    do carro. Se você for financiar, a declaração é dispensada.
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
                  <label className="etapaRenda-upload">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={selecionarArquivo}
                      disabled={enviando}
                    />
                    <span className="etapaRenda-upload-icone" aria-hidden="true">
                      <svg width="15" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M11.4751 15.225V1.72498M5.4751 6.97498L11.4751 0.974976L17.4751 6.97498M0.975098 15.225V21.225H21.9751V15.225"
                          strokeWidth="1.95"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          stroke="#16A095"
                        />
                      </svg>
                    </span>
                    <span>
                      {arquivo ? (
                        <>
                          Arquivo selecionado: <strong> {arquivo.name}</strong>
                        </>
                      ) : declaracaoRejeitada ? (
                        <>
                          <strong>A declaração enviada foi recusada ou venceu.</strong>{' '}
                          Selecione um novo arquivo.
                        </>
                      ) : declaracaoBackend ? (
                        <>
                          <strong>Declaração já enviada</strong> (consta no checklist).
                        </>
                      ) : (
                        <>
                          Selecione a declaração do computador
                          <strong> (PDF, JPG ou PNG)</strong>
                        </>
                      )}
                    </span>
                  </label>
                  {arquivo && (
                    <button type="button" onClick={() => setArquivo(null)} disabled={enviando}>
                      Remover
                    </button>
                  )}
                  <div className="etapaRenda-ano">
                    <label htmlFor="ano-calendario">Ano-calendário</label>
                    <select
                      id="ano-calendario"
                      value={ano}
                      onChange={(event) => setAno(Number(event.target.value))}
                    >
                      {anos.map((ano) => (
                        <option key={ano} value={ano}>
                          {ano}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="etapaRenda-aviso">
                  <IconeCheck /> Como você vai financiar o veículo, a declaração
                  de Imposto de Renda não é necessária nesta etapa.
                </div>
              )}
            </section>

            <section className="etapaRenda-card etapaRenda-card-gov">
              <div className="etapaRenda-card-cabecalho">
                <div>
                  <h2>Conta gov.br</h2>
                  <p>
                    Na próxima etapa você vai usar o gov.br para entrar
                    no SISEN e enviar o pedido.
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
                A Receita verifica se a renda e o patrimônio são compatíveis com o valor do veículo.
              </p>
              <p>
                <IconeCheckCirculo />
                O pedido é feito no SISEN, que usa seu acesso gov.br.
              </p>
            </section>

            <section className="etapaRenda-ajuda-card">
              <h3>Não tem conta gov.br?</h3>
              <p>
                Marque "Não tenho conta" e mostraremos o passo
                a passo para criar a sua pelo app ou site gov.br.
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
                ) : etapaConcluida ? (
                  <>
                    <IconeCheck />
                    <span>Etapa concluída</span>
                  </>
                ) : (
                  <>
                    <IconeCadeado />
                    <span>Concluir etapa</span>
                  </>
                )}
              </button>
              <span className={erro ? 'etapaRenda-erro' : undefined} role={erro ? 'alert' : undefined}>
                {mensagemPendente}
              </span>
            </section>
          </aside>
        </div>
      </div>
    </PainelLayout>
  );
}