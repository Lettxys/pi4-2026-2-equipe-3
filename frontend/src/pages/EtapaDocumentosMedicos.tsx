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

import './EtapaIdentificacao.css';
import './EtapaConcluida.css';

interface EtapaDocumentosMedicosProps {
  aoSair: () => void | Promise<void>;
  voltarTrilha: () => void;
  aoConcluir?: () => void;
  aoComecarProximaEtapa?: () => void;
  aoEtapaConcluida?: () => void;
  aoNavegar?: (destino: DestinoMenu) => void;
  categoria?: string;
  totalEtapas?: number;
}

type StatusDocumento = 'pendente' | 'enviando' | 'conferido' | 'erro';

interface Documento {
  id: string;
  titulo: string;
  descricao: string;
  status: StatusDocumento;
  progresso: number;
  arquivo: File | null;
  emitidoEm?: string;
  erro: string;
}

interface ModeloDocumento {
  id: string;
  titulo: string;
  descricao: string;
}

const NUMERO_ETAPA = 2;

const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png'];
const EXTENSOES_ACEITAS = ['pdf', 'jpg', 'jpeg', 'png'];
const TAMANHO_MAXIMO = 2 * 1024 * 1024; // 2 MB
const TEMPO_AVISO = 4000; // ms

const DICAS = [
  'Confira se o laudo traz o CID e a descrição da deficiência.',
  'Veja se o documento está dentro do prazo de validade.',
  'Fotografe com boa luz e sem cortar as bordas do documento.',
  'Utilize algum aplicativo de digitalizar foto.',
];

const DOCUMENTOS_DO_BACKEND: Record<string, ModeloDocumento> = {
  MEDICAL_REPORT_IPI: {
    id: 'MEDICAL_REPORT_IPI',
    titulo: 'Laudo médico para o IPI',
    descricao:
      'Laudo com CID e caracterização da deficiência, dentro do prazo de validade.',
  },
  MEDICAL_REPORT_ICMS: {
    id: 'MEDICAL_REPORT_ICMS',
    titulo: 'Laudo médico para o ICMS e o IPVA',
    descricao:
      'Laudo com CID e caracterização da deficiência, dentro do prazo de validade.',
  },
};

const DOCUMENTOS_BASE: ModeloDocumento[] = [
  {
    id: 'laudo',
    titulo: 'Laudo médico',
    descricao:
      'Laudo com CID e caracterização da deficiência, dentro do prazo de validade.',
  },
];

const DOCUMENTOS_POR_CATEGORIA: Record<string, ModeloDocumento[]> = {
  auditiva: [
    {
      id: 'audiograma',
      titulo: 'Audiograma',
      descricao: 'Exame que comprova a perda auditiva bilateral.',
    },
  ],
 
};

function documentosDaCategoria(categoria?: string): ModeloDocumento[] {
  const extras = categoria ? DOCUMENTOS_POR_CATEGORIA[categoria] ?? [] : [];

  return [...DOCUMENTOS_BASE, ...extras];
}

function criarDocumentos(modelos: ModeloDocumento[]): Documento[] {
  return modelos.map((modelo) => ({
    ...modelo,
    status: 'pendente',
    progresso: 0,
    arquivo: null,
    erro: '',
  }));
}

function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function IconeDocumento() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5M9 13h6M9 17h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeCheckCirculo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m8 12.5 3 3 5-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
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

function IconeAlerta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7.5v5.5M12 16.2v.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V4m0 0L8 8m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeCadeado() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 10.5V7.5a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeInfo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 11v5M12 8v.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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

function IconeCheckPequeno() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="m3.5 8.5 3 3 6-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function EtapaDocumentosMedicos({
  aoSair,
  voltarTrilha,
  aoConcluir,
  aoComecarProximaEtapa,
  aoEtapaConcluida,
  aoNavegar,
  categoria,
  totalEtapas = 6,
}: EtapaDocumentosMedicosProps) {
  const [modelos, setModelos] = useState<ModeloDocumento[]>(() =>
    documentosDaCategoria(categoria)
  );
  const [documentos, setDocumentos] = useState<Documento[]>(() =>
    criarDocumentos(documentosDaCategoria(categoria))
  );
  const [processId, setProcessId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(temToken());
  const [arrastando, setArrastando] = useState('');
  const [aviso, setAviso] = useState('');
  const [erroEtapa, setErroEtapa] = useState('');
  const [concluindo, setConcluindo] = useState(false);
  const [etapaConcluida, setEtapaConcluida] = useState(false);

  const seletores = useRef<Record<string, HTMLInputElement | null>>({});
  const temporizadores = useRef<Record<string, number>>({});
  const envios = useRef<Record<string, number>>({});
  const temporizadorAviso = useRef<number>(0);
  const botaoProximaEtapa = useRef<HTMLButtonElement | null>(null);

  const modoReal = processId !== null;

  useEffect(() => {
    if (!temToken()) {
      return;
    }

    let ativo = true;

    async function carregar() {
      try {
        const eu = await buscarUsuarioLogado();

        if (!eu.activeProcessId) {
          return;
        }

        const checklist = await buscarChecklistDocumentos(eu.activeProcessId);
        const tipos = Array.from(
          new Set(
            checklist
              .map((item) => item.documentType)
              .filter((tipo) => tipo in DOCUMENTOS_DO_BACKEND)
          )
        );

        if (!ativo || tipos.length === 0) {
          return;
        }

        const reais = tipos.map((tipo) => DOCUMENTOS_DO_BACKEND[tipo]);

        setProcessId(eu.activeProcessId);
        setModelos(reais);
        setDocumentos(criarDocumentos(reais));
      } catch {
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const ativos = temporizadores.current;

    return () => {
      Object.values(ativos).forEach((id) => window.clearInterval(id));
      window.clearTimeout(temporizadorAviso.current);
    };
  }, []);

  useEffect(() => {
    if (!etapaConcluida) {
      return;
    }

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

  const conferidos = documentos.filter((doc) => doc.status === 'conferido').length;
  const total = documentos.length;
  const porcentagem = total > 0 ? Math.round((conferidos / total) * 100) : 0;
  const faltam = total - conferidos;

  function atualizarDocumento(id: string, mudancas: Partial<Documento>) {
    setDocumentos((atual) =>
      atual.map((doc) => (doc.id === id ? { ...doc, ...mudancas } : doc))
    );
  }

  function mostrarAviso(texto: string) {
    window.clearTimeout(temporizadorAviso.current);
    setAviso(texto);

    temporizadorAviso.current = window.setTimeout(
      () => setAviso(''),
      TEMPO_AVISO
    );
  }

  function pararEnvio(id: string) {
    const temporizador = temporizadores.current[id];

    if (temporizador) {
      window.clearInterval(temporizador);
      delete temporizadores.current[id];
    }
  }

  function tituloDoDocumento(id: string): string {
    return modelos.find((modelo) => modelo.id === id)?.titulo ?? 'Documento';
  }

  function simularEnvio(id: string, arquivo: File) {
    pararEnvio(id);

    atualizarDocumento(id, {
      status: 'enviando',
      progresso: 0,
      arquivo,
      erro: '',
    });

    let progresso = 0;

    temporizadores.current[id] = window.setInterval(() => {
      progresso = Math.min(100, progresso + 8 + Math.round(Math.random() * 8));

      if (progresso >= 100) {
        pararEnvio(id);
        atualizarDocumento(id, { status: 'conferido', progresso: 100 });
        mostrarAviso(`${tituloDoDocumento(id)} conferido`);
        return;
      }

      atualizarDocumento(id, { progresso });
    }, 250);
  }

  async function enviarReal(id: string, arquivo: File, idProcesso: number) {
    pararEnvio(id);

    const numeroEnvio = (envios.current[id] ?? 0) + 1;
    envios.current[id] = numeroEnvio;

    atualizarDocumento(id, {
      status: 'enviando',
      progresso: 0,
      arquivo,
      erro: '',
    });

    let progresso = 0;

    temporizadores.current[id] = window.setInterval(() => {
      progresso = Math.min(90, progresso + 10);
      atualizarDocumento(id, { progresso });
    }, 250);

    try {
      await enviarDocumento(idProcesso, { file: arquivo, documentType: id });

      if (envios.current[id] !== numeroEnvio) {
        return;
      }

      pararEnvio(id);
      atualizarDocumento(id, { status: 'conferido', progresso: 100 });
      mostrarAviso(`${tituloDoDocumento(id)} conferido`);
    } catch (error) {
      if (envios.current[id] !== numeroEnvio) {
        return;
      }

      pararEnvio(id);
      atualizarDocumento(id, {
        status: 'erro',
        progresso: 0,
        arquivo: null,
        erro: extrairMensagemDeErro(
          error,
          'Não foi possível enviar o documento. Tente novamente.'
        ),
      });
    }
  }

  function iniciarEnvio(id: string, arquivo: File) {
    setErroEtapa('');

    if (processId !== null) {
      void enviarReal(id, arquivo, processId);
    } else {
      simularEnvio(id, arquivo);
    }
  }

  function validarArquivo(arquivo: File): string {
    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? '';
    const extensaoOk = EXTENSOES_ACEITAS.includes(extensao);
    const tipoOk = !arquivo.type || TIPOS_ACEITOS.includes(arquivo.type);

    if (!extensaoOk || !tipoOk) {
      return `O arquivo "${arquivo.name}" não está em um formato aceito. Envie em PDF, JPG ou PNG.`;
    }

    if (arquivo.size === 0) {
      return `O arquivo "${arquivo.name}" está vazio. Envie outro arquivo.`;
    }

    if (arquivo.size > TAMANHO_MAXIMO) {
      return `O arquivo "${arquivo.name}" tem ${formatarTamanho(arquivo.size)} e passa do limite de 2 MB. Envie um arquivo menor.`;
    }

    return '';
  }

  function receberArquivo(id: string, arquivo: File | undefined) {
    if (!arquivo) {
      return;
    }

    const mensagemErro = validarArquivo(arquivo);

    if (mensagemErro) {
      pararEnvio(id);
      envios.current[id] = (envios.current[id] ?? 0) + 1;
      atualizarDocumento(id, {
        status: 'erro',
        progresso: 0,
        arquivo: null,
        erro: mensagemErro,
      });
      return;
    }

    iniciarEnvio(id, arquivo);
  }

  function aoEscolherArquivo(id: string, event: ChangeEvent<HTMLInputElement>) {
    receberArquivo(id, event.target.files?.[0]);
    event.target.value = '';
  }

  function aoSoltar(id: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setArrastando('');
    receberArquivo(id, event.dataTransfer.files?.[0]);
  }

  function abrirSeletor(id: string) {
    seletores.current[id]?.click();
  }

  function cancelarEnvio(id: string) {
    pararEnvio(id);
    envios.current[id] = (envios.current[id] ?? 0) + 1;
    atualizarDocumento(id, {
      status: 'pendente',
      progresso: 0,
      arquivo: null,
      erro: '',
    });
  }

  function verArquivo(arquivo: File | null) {
    if (!arquivo) {
      return;
    }

    const endereco = URL.createObjectURL(arquivo);
    window.open(endereco, '_blank', 'noopener');
  }

  async function concluirEtapa() {
    if (faltam > 0 || concluindo) {
      return;
    }

    setErroEtapa('');

    if (processId !== null) {
      setConcluindo(true);

      try {
        const resultado = await validarEtapa(processId, NUMERO_ETAPA);

        if (!resultado.isValidated) {
          const mensagens = resultado.validationErrors
            .map((erro) => erro.message)
            .filter(Boolean);

          setErroEtapa(
            mensagens.length > 0
              ? mensagens.join(' ')
              : 'A etapa ainda não pôde ser validada.'
          );
          return;
        }
      } catch (error) {
        setErroEtapa(
          extrairMensagemDeErro(error, 'Não foi possível validar a etapa.')
        );
        return;
      } finally {
        setConcluindo(false);
      }
    }

    aoEtapaConcluida?.();
    setEtapaConcluida(true);
  }

  function irParaTrilha() {
    setEtapaConcluida(false);
    (aoConcluir ?? voltarTrilha)();
  }

  function comecarProximaEtapa() {
    setEtapaConcluida(false);
    (aoComecarProximaEtapa ?? aoConcluir ?? voltarTrilha)();
  }

  const textoStatus: Record<StatusDocumento, string> = {
    pendente: 'Pendente',
    enviando: 'Enviando...',
    conferido: 'Conferido',
    erro: 'Precisa corrigir',
  };

  return (
    <PainelLayout
      aoSair={aoSair}
      aoNavegar={aoNavegar}
      itemAtivo="processo"
      caminho={['Meu processo', 'Etapa 2 · Documentos médicos']}
    >
      {aviso && (
        <div className="etapa-toast" role="status">
          <span className="etapa-toast-icone">
            <IconeCheckCirculo />
          </span>
          {aviso}
        </div>
      )}

      <main className="etapa-content">
        <section className="etapa-main">
          <button type="button" className="etapa-voltar" onClick={voltarTrilha}>
            <IconeSeta />
            Voltar para a trilha
          </button>

          <div
            className="etapa-passos"
            role="progressbar"
            aria-label="Etapas do processo"
            aria-valuenow={NUMERO_ETAPA}
            aria-valuemin={1}
            aria-valuemax={totalEtapas}
          >
            {Array.from({ length: totalEtapas }, (_, indice) => (
              <span
                key={indice}
                className={indice < NUMERO_ETAPA ? 'ativo' : ''}
              />
            ))}
          </div>

          <p className="etapa-rotulo">
            ETAPA {NUMERO_ETAPA} DE {totalEtapas}
          </p>

          <h1 className="etapa-titulo">
            Documentos médicos: <span>laudos e exames</span>
          </h1>

          <p className="etapa-subtitulo">
            Envie {total === 1 ? 'o documento' : `os ${total} documentos`}{' '}
            abaixo para liberar a etapa {NUMERO_ETAPA + 1}. Seu progresso é
            salvo automaticamente.
          </p>

          <div className="etapa-progresso">
            <strong>
              {conferidos} de {total} conferidos
            </strong>

            <div
              className="etapa-progresso-barra"
              role="progressbar"
              aria-label="Documentos conferidos"
              aria-valuenow={porcentagem}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${porcentagem}%` }} />
            </div>

            <strong className="etapa-progresso-pct">{porcentagem}%</strong>
          </div>

          {carregando ? (
            <p className="etapa-subtitulo">Carregando documentos...</p>
          ) : (
            <div className="etapa-documentos">
              {documentos.map((doc) => (
                <article
                  key={doc.id}
                  className={`etapa-doc etapa-doc-${doc.status}`}
                >
                  <div className="etapa-doc-icone">
                    <IconeDocumento />
                  </div>

                  <div className="etapa-doc-topo">
                    <div>
                      <h2>{doc.titulo}</h2>
                      <p>{doc.descricao}</p>
                    </div>

                    <span className={`etapa-selo etapa-selo-${doc.status}`}>
                      {doc.status === 'conferido' && <IconeCheckPequeno />}
                      {textoStatus[doc.status]}
                    </span>
                  </div>

                  <div className="etapa-doc-corpo">
                    <input
                      ref={(elemento) => {
                        seletores.current[doc.id] = elemento;
                      }}
                      type="file"
                      className="etapa-arquivo-oculto"
                      onChange={(event) => aoEscolherArquivo(doc.id, event)}
                      tabIndex={-1}
                      aria-hidden="true"
                    />

                    {doc.status === 'conferido' && doc.arquivo && (
                      <div className="etapa-arquivo">
                        <span className="etapa-arquivo-check">
                          <IconeCheckCirculo />
                        </span>

                        <span className="etapa-arquivo-nome">
                          {doc.arquivo.name} · {formatarTamanho(doc.arquivo.size)}
                        </span>

                        {doc.emitidoEm && (
                          <span className="etapa-arquivo-data">
                            Emitido em {doc.emitidoEm}
                          </span>
                        )}

                        <button
                          type="button"
                          className="etapa-link"
                          onClick={() => verArquivo(doc.arquivo)}
                        >
                          Ver
                        </button>

                        <button
                          type="button"
                          className="etapa-link"
                          onClick={() => abrirSeletor(doc.id)}
                        >
                          Substituir
                        </button>
                      </div>
                    )}

                    {doc.status === 'enviando' && doc.arquivo && (
                      <div className="etapa-envio">
                        <div className="etapa-envio-linha">
                          <span className="etapa-envio-nome">
                            Enviando {doc.arquivo.name} · {formatarTamanho(doc.arquivo.size)}
                          </span>
                          <strong>{doc.progresso}%</strong>
                        </div>

                        <div className="etapa-envio-barra">
                          <span style={{ width: `${doc.progresso}%` }} />
                        </div>

                        <div className="etapa-envio-linha">
                          <span className="etapa-envio-info">
                            Conferindo formato, tamanho e data...
                          </span>
                          <button
                            type="button"
                            className="etapa-cancelar"
                            onClick={() => cancelarEnvio(doc.id)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {doc.status === 'erro' && (
                      <>
                        <div className="etapa-erro-caixa" role="alert">
                          <IconeAlerta />
                          <p>{doc.erro}</p>
                        </div>

                        <button
                          type="button"
                          className="etapa-botao-outro"
                          onClick={() => abrirSeletor(doc.id)}
                        >
                          Enviar outro arquivo
                        </button>
                      </>
                    )}

                    {doc.status === 'pendente' && (
                      <>
                        <ul className="etapa-formatos">
                          <li>PDF, JPG ou PNG</li>
                          <li>Até 2 MB</li>
                          <li>Legível e completo</li>
                        </ul>

                        <div
                          className={`etapa-soltar${
                            arrastando === doc.id ? ' arrastando' : ''
                          }`}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setArrastando(doc.id);
                          }}
                          onDragLeave={() => setArrastando('')}
                          onDrop={(event) => aoSoltar(doc.id, event)}
                        >
                          <IconeUpload />

                          <span>
                            Arraste o arquivo aqui ou{' '}
                            <button
                              type="button"
                              onClick={() => abrirSeletor(doc.id)}
                            >
                              selecione do computador
                            </button>
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="etapa-lateral">
          <section className="etapa-dicas">
            <h2>Dicas desta etapa</h2>

            <ul>
              {DICAS.map((dica) => (
                <li key={dica}>{dica}</li>
              ))}
            </ul>
          </section>

          <section className="etapa-concluir">
            <h2>Concluir etapa</h2>

            <p>
              Quando {total === 1 ? 'o documento estiver conferido' : `os ${total} documentos estiverem conferidos`}
              , a etapa {NUMERO_ETAPA + 1} será liberada.
            </p>

            <button
              type="button"
              className="etapa-concluir-botao"
              disabled={faltam > 0 || concluindo || carregando}
              onClick={() => void concluirEtapa()}
            >
              {faltam > 0 && <IconeCadeado />}
              {concluindo ? 'Validando...' : `Concluir etapa ${NUMERO_ETAPA}`}
            </button>

            <span className="etapa-concluir-info">
              {faltam > 0
                ? `Faltam ${faltam} ${faltam === 1 ? 'documento' : 'documentos'}`
                : 'Todos os documentos conferidos'}
            </span>

            {erroEtapa && (
              <div className="etapa-erro-caixa" role="alert">
                <IconeAlerta />
                <p>{erroEtapa}</p>
              </div>
            )}
          </section>

          {!carregando && !modoReal && (
            <section className="etapa-aviso">
              <IconeInfo />

              <p>
                Modo de demonstração: não há processo ativo com documentos
                desta etapa, então os envios não são salvos.
              </p>
            </section>
          )}

          <section className="etapa-aviso">
            <IconeInfo />

            <p>
              O isenta+ confere formato, tamanho e datas dos arquivos. A
              análise final do pedido é feita pela Receita Federal.
            </p>
          </section>
        </aside>
      </main>

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

            <h2 id="etapa-concluida-titulo">
              Etapa {NUMERO_ETAPA} concluída!
            </h2>

            <p className="etapa-concluida-texto">
              Seus documentos médicos foram conferidos.
              <br />
              <strong>Etapa {NUMERO_ETAPA + 1}</strong> liberada.
            </p>

            <div className="etapa-concluida-passos" aria-hidden="true">
              {Array.from({ length: totalEtapas }, (_, indice) => (
                <span
                  key={indice}
                  className={
                    indice < NUMERO_ETAPA
                      ? 'ativo'
                      : indice === NUMERO_ETAPA
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
                Começar etapa {NUMERO_ETAPA + 1}
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