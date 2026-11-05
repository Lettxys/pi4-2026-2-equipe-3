import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';

import './EtapaIdentificacao.css';
import './EtapaConcluida.css';

interface EtapaIdentificacaoProps {
  aoSair: () => void | Promise<void>;
  voltarTrilha: () => void;
  aoConcluir?: () => void;
  // Chamado por "Começar etapa 2" no modal. Se não for informado, leva à trilha.
  aoComecarEtapa2?: () => void;
  aoNavegar?: (destino: DestinoMenu) => void;
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

const NUMERO_ETAPA = 1;
const TOTAL_ETAPAS = 6;

const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png'];
const EXTENSOES_ACEITAS = ['pdf', 'jpg', 'jpeg', 'png'];
const TAMANHO_MAXIMO = 2 * 1024 * 1024; // 2 MB
const TEMPO_AVISO = 4000; // ms

const DICAS = [
  'Fotografe com boa luz e sem cortar as bordas do documento.',
  'Utilize algum aplicativo de digitalizar foto.',
  'Junte frente e verso do RG em um único PDF.',
  'Confira a data de emissão do comprovante antes de enviar.',
];

const DOCUMENTOS_INICIAIS: Documento[] = [
  {
    id: 'identidade',
    titulo: 'Documento de identidade',
    descricao: 'RG (frente e verso) ou CNH, legível e dentro da validade.',
    status: 'pendente',
    progresso: 0,
    arquivo: null,
    erro: '',
  },
  {
    id: 'endereco',
    titulo: 'Comprovante de endereço',
    descricao:
      'Conta de água, luz ou telefone no seu nome, emitida há no máximo 90 dias.',
    status: 'pendente',
    progresso: 0,
    arquivo: null,
    erro: '',
  },
  {
    id: 'cpf',
    titulo: 'CPF',
    descricao:
      'Comprovante de inscrição no CPF. A situação precisa estar regular na Receita Federal.',
    status: 'pendente',
    progresso: 0,
    arquivo: null,
    erro: '',
  },
];

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

export default function EtapaIdentificacao({
  aoSair,
  voltarTrilha,
  aoConcluir,
  aoComecarEtapa2,
  aoNavegar,
}: EtapaIdentificacaoProps) {
  const [documentos, setDocumentos] = useState<Documento[]>(DOCUMENTOS_INICIAIS);
  const [arrastando, setArrastando] = useState('');
  const [aviso, setAviso] = useState('');
  const [etapaConcluida, setEtapaConcluida] = useState(false);

  const seletores = useRef<Record<string, HTMLInputElement | null>>({});
  const temporizadores = useRef<Record<string, number>>({});
  const temporizadorAviso = useRef<number>(0);
  const botaoEtapa2 = useRef<HTMLButtonElement | null>(null);

  // Limpa os envios em andamento ao sair da tela
  useEffect(() => {
    const ativos = temporizadores.current;

    return () => {
      Object.values(ativos).forEach((id) => window.clearInterval(id));
      window.clearTimeout(temporizadorAviso.current);
    };
  }, []);

  // Modal de etapa concluída: foco no botão principal e fechamento com Esc
  useEffect(() => {
    if (!etapaConcluida) {
      return;
    }

    botaoEtapa2.current?.focus();

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
  const porcentagem = Math.round((conferidos / total) * 100);
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

  // TODO: trocar esta simulação pela chamada real da API de upload.
  // Hoje o progresso é só visual e nada é enviado ao servidor.
  function iniciarEnvio(id: string, arquivo: File) {
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

        const titulo = DOCUMENTOS_INICIAIS.find((doc) => doc.id === id)?.titulo;
        mostrarAviso(`${titulo ?? 'Documento'} conferido`);
        return;
      }

      atualizarDocumento(id, { progresso });
    }, 250);
  }

  // Verifica formato e tamanho no navegador. A conferência de legibilidade
  // e de datas depende do servidor.
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

  // "Concluir etapa" abre o modal de etapa concluída (só com todos conferidos)
  function concluirEtapa() {
    if (faltam > 0) {
      return;
    }

    setEtapaConcluida(true);
  }

  function irParaTrilha() {
    setEtapaConcluida(false);
    (aoConcluir ?? voltarTrilha)();
  }

  function comecarEtapa2() {
    setEtapaConcluida(false);
    (aoComecarEtapa2 ?? aoConcluir ?? voltarTrilha)();
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
      caminho={['Meu processo', 'Etapa 1 · Identificação']}
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
            aria-valuemax={TOTAL_ETAPAS}
          >
            {Array.from({ length: TOTAL_ETAPAS }, (_, indice) => (
              <span
                key={indice}
                className={indice < NUMERO_ETAPA ? 'ativo' : ''}
              />
            ))}
          </div>

          <p className="etapa-rotulo">
            ETAPA {NUMERO_ETAPA} DE {TOTAL_ETAPAS}
          </p>

          <h1 className="etapa-titulo">
            Identificação: <span>seus documentos pessoais</span>
          </h1>

          <p className="etapa-subtitulo">
            Envie os {total} documentos abaixo para liberar a etapa 2. Seu
            progresso é salvo automaticamente.
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
              Quando os {total} documentos estiverem conferidos, a etapa 2
              (Documentos médicos) será liberada.
            </p>

            <button
              type="button"
              className="etapa-concluir-botao"
              disabled={faltam > 0}
              onClick={concluirEtapa}
            >
              {faltam > 0 && <IconeCadeado />}
              Concluir etapa {NUMERO_ETAPA}
            </button>

            <span className="etapa-concluir-info">
              {faltam > 0
                ? `Faltam ${faltam} ${faltam === 1 ? 'documento' : 'documentos'}`
                : 'Todos os documentos conferidos'}
            </span>
          </section>

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
              Seus documentos pessoais foram conferidos.
              <br />
              <strong>
                Etapa {NUMERO_ETAPA + 1} · Documentos médicos
              </strong>{' '}
              liberada.
            </p>

            <div className="etapa-concluida-passos" aria-hidden="true">
              {Array.from({ length: TOTAL_ETAPAS }, (_, indice) => (
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
                ref={botaoEtapa2}
                type="button"
                className="etapa-concluida-primario"
                onClick={comecarEtapa2}
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