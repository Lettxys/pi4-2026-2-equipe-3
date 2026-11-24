import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';
import {
  buscarCondutores,
  buscarUsuarioLogado,
  temToken,
} from '../services/api';
import type { ListDriversResponse } from '../services/api';
import {
  listarDocumentosDaEtapa,
  paraArquivo,
  salvarDocumento,
} from '../services/documentosSalvos';
import { montarPerfil, proximaEtapaComTela } from '../services/regrasPerfil';
import type { ChaveEtapaPerfil } from '../services/regrasPerfil';
import { lerRespostasAtivas } from '../services/respostasPerfil';

import './EtapaIdentificacao.css';
import './EtapaConcluida.css';

const TITULO_ETAPA = 'Condutores autorizados';

const DICAS = [
  'Dê preferência a imagens legíveis, sem cortes nas bordas do documento.',
  'Use PDF, JPG ou PNG, até 2 MB por arquivo.',
  'Confira se os documentos estão legíveis, completos e dentro da validade.',
  'Liste quantas pessoas estão autorizadas a conduzir o veículo.',
];

interface DocumentoCondutor {
  rg: File | null;
  cnh: File | null;
}

export interface DocumentosCondutores {
  beneficiarioEhCondutor: boolean;
  quantidadeCondutores: number;
  cnhBeneficiario?: File;
  condutores: DocumentoCondutor[];
}

interface EtapaCondutoresProps {
  aoSair: () => void | Promise<void>;
  voltarTrilha: () => void;
  aoConcluir?: () => void;
  aoComecarProximaEtapa?: (chave?: ChaveEtapaPerfil) => void;
  aoEtapaConcluida?: () => void;
  aoNavegar?: (destino: DestinoMenu) => void;
  beneficiarioEhCondutor: boolean;
}

function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
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

function SoltarArquivo({
  arquivo,
  onArquivoSelecionado,
  rotulo,
}: {
  arquivo: File | null;
  onArquivoSelecionado: (arquivo: File) => void;
  rotulo?: string;
}) {
  const seletor = useRef<HTMLInputElement | null>(null);

  function abrirSeletor() {
    seletor.current?.click();
  }

  return (
    <div>
      {rotulo && <span className="etapa-doc-rotulo">{rotulo}</span>}

      <input
        ref={seletor}
        type="file"
        className="etapa-arquivo-oculto"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const selecionado = event.target.files?.[0];

          if (selecionado) {
            onArquivoSelecionado(selecionado);
          }

          event.target.value = '';
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {arquivo ? (
        <div className="etapa-arquivo">
          <span className="etapa-arquivo-check">
            <IconeCheckCirculo />
          </span>

          <span className="etapa-arquivo-nome">
            {arquivo.name} · {formatarTamanho(arquivo.size)}
          </span>

          <button type="button" className="etapa-link" onClick={abrirSeletor}>
            Alterar
          </button>
        </div>
      ) : (
        <div
          className="etapa-soltar"
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={abrirSeletor}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              abrirSeletor();
            }
          }}
        >
          <IconeUpload />

          <span>
            Arraste o arquivo aqui ou <button type="button">selecione do computador</button>
          </span>
        </div>
      )}
    </div>
  );
}

export default function EtapaCondutores({
  aoSair,
  voltarTrilha,
  aoConcluir,
  aoComecarProximaEtapa,
  aoEtapaConcluida,
  aoNavegar,
  beneficiarioEhCondutor,
}: EtapaCondutoresProps) {
  const chaveEtapa: ChaveEtapaPerfil = beneficiarioEhCondutor
    ? 'minha-cnh'
    : 'condutores';

  const [cnhBeneficiario, setCnhBeneficiario] = useState<File | null>(null);

  const [condutores, setCondutores] = useState<DocumentoCondutor[]>([
    { rg: null, cnh: null },
    { rg: null, cnh: null },
    { rg: null, cnh: null },
  ]);

  const [condutoresBackend, setCondutoresBackend] =
    useState<ListDriversResponse | null>(null);

  const [respostasQuiz] = useState(lerRespostasAtivas);

  const etapasDoPerfil = montarPerfil(respostasQuiz ?? {}).etapas;
  const posicaoNoPerfil = etapasDoPerfil.findIndex(
    (etapa) => etapa.chave === chaveEtapa
  );
  const numeroEtapa = posicaoNoPerfil >= 0 ? posicaoNoPerfil + 1 : 1;
  const totalEtapas = etapasDoPerfil.length;
  const proxima = proximaEtapaComTela(etapasDoPerfil, chaveEtapa);
  const numeroProxima = proxima ? proxima.numero : numeroEtapa + 1;
  const tituloProxima = proxima ? proxima.etapa.titulo : '';

  const [erro, setErro] = useState('');

  const [etapaConcluida, setEtapaConcluida] = useState(false);
  const botaoProximaEtapa = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let ativo = true;

    void listarDocumentosDaEtapa(chaveEtapa).then((salvos) => {
      if (!ativo || salvos.length === 0) {
        return;
      }

      const novosCondutores: DocumentoCondutor[] = [
        { rg: null, cnh: null },
        { rg: null, cnh: null },
        { rg: null, cnh: null },
      ];

      for (const salvo of salvos) {
        if (salvo.documentoId === 'cnh-beneficiario') {
          setCnhBeneficiario(paraArquivo(salvo));
          continue;
        }

        const partes = /^condutor-(\d+)-(rg|cnh)$/.exec(salvo.documentoId);

        if (!partes) {
          continue;
        }

        const posicao = Number(partes[1]) - 1;
        const tipo = partes[2] as 'rg' | 'cnh';

        if (novosCondutores[posicao]) {
          novosCondutores[posicao][tipo] = paraArquivo(salvo);
        }
      }

      setCondutores(novosCondutores);
    });

    return () => {
      ativo = false;
    };
  }, [chaveEtapa]);

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

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!temToken()) {
        return;
      }

      try {
        const eu = await buscarUsuarioLogado();

        if (!eu.activeProcessId) {
          return;
        }

        const dados = await buscarCondutores(eu.activeProcessId).catch(
          () => null
        );

        if (ativo && dados) {
          setCondutoresBackend(dados);
        }
      } catch {
        return;
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, []);

  const quantidadeCondutores = respostasQuiz?.condutores ?? 1;

  function atualizarDocumento(
    index: number,
    tipo: 'rg' | 'cnh',
    arquivo: File
  ) {
    setCondutores((atual) =>
      atual.map((condutor, i) =>
        i === index ? { ...condutor, [tipo]: arquivo } : condutor
      )
    );

    setErro('');

    void salvarDocumento({
      etapa: chaveEtapa,
      etapaTitulo: TITULO_ETAPA,
      documentoId: `condutor-${index + 1}-${tipo}`,
      titulo: `${tipo === 'rg' ? 'RG' : 'CNH'} do condutor ${index + 1}`,
      arquivo,
    });
  }

  function definirCnhBeneficiario(arquivo: File) {
    setCnhBeneficiario(arquivo);
    setErro('');

    void salvarDocumento({
      etapa: chaveEtapa,
      etapaTitulo: TITULO_ETAPA,
      documentoId: 'cnh-beneficiario',
      titulo: 'CNH do beneficiário',
      arquivo,
    });
  }

  function validarDocumentos(): string[] {
    if (beneficiarioEhCondutor) {
      if (!cnhBeneficiario) {
        return ['Envie a CNH do beneficiário.'];
      }

      return [];
    }

    const erros: string[] = [];

    for (let i = 0; i < quantidadeCondutores; i++) {
      if (!condutores[i]?.rg) {
        erros.push(`Envie o RG do condutor ${i + 1}.`);
      }

      if (!condutores[i]?.cnh) {
        erros.push(`Envie a CNH do condutor ${i + 1}.`);
      }
    }

    return erros;
  }

  function handleConcluir() {
    const erros = validarDocumentos();
    const primeiroErro = erros[0];

    if (erros.length > 0 && primeiroErro) {
      setErro(primeiroErro);
      return;
    }

    setErro('');
    setEtapaConcluida(true);
    aoEtapaConcluida?.();
  }

  function comecarProximaEtapa() {
    setEtapaConcluida(false);

    if (proxima && aoComecarProximaEtapa) {
      aoComecarProximaEtapa(proxima.etapa.chave);
      return;
    }

    (aoConcluir ?? voltarTrilha)();
  }

  function irParaTrilha() {
    setEtapaConcluida(false);
    (aoConcluir ?? voltarTrilha)();
  }

  const erros = validarDocumentos();

  return (
    <PainelLayout
      aoSair={aoSair}
      aoNavegar={aoNavegar}
      itemAtivo="processo"
      caminho={['Meu processo', `Etapa ${numeroEtapa} · ${TITULO_ETAPA}`]}
    >
      <main className="etapa-content">
        <section className="etapa-main">
          <button type="button" className="etapa-voltar" onClick={voltarTrilha}>
            <IconeSeta />
            Voltar para a trilha
          </button>

          <p className="etapa-rotulo">
            ETAPA {numeroEtapa} DE {totalEtapas}
          </p>

          <h1 className="etapa-titulo">Condutores autorizados</h1>

          <p className="etapa-subtitulo">
            Envie os documentos necessários para continuar seu processo.
          </p>

          {beneficiarioEhCondutor ? (
            <article className="etapa-doc" style={{ display: 'block' }}>
              <div className="etapa-doc-topo">
                <div>
                  <h2>CNH do beneficiário</h2>

                  <p>Envie uma imagem legível ou PDF da sua CNH.</p>
                </div>
              </div>

              <div className="etapa-doc-corpo">
                <SoltarArquivo
                  arquivo={cnhBeneficiario}
                  onArquivoSelecionado={definirCnhBeneficiario}
                  rotulo="CNH do beneficiário"
                />
              </div>
            </article>
          ) : (
            <>
              {Array.from({ length: quantidadeCondutores }, (_, index) => (
                <article
                  className="etapa-doc"
                  key={index}
                  style={{ display: 'block', marginTop: 18 }}
                >
                  <div className="etapa-doc-topo">
                    <div>
                      <h2>Condutor autorizado {index + 1}</h2>

                      <p>
                        {condutoresBackend?.drivers[index]?.fullName ??
                          'Envie o RG e a CNH deste condutor.'}
                      </p>
                    </div>
                  </div>

                  <div className="etapa-documentos-grid">
                    <SoltarArquivo
                      arquivo={condutores[index]?.rg ?? null}
                      onArquivoSelecionado={(arquivo) =>
                        atualizarDocumento(index, 'rg', arquivo)
                      }
                      rotulo={`RG do condutor ${index + 1} — frente e verso`}
                    />

                    <SoltarArquivo
                      arquivo={condutores[index]?.cnh ?? null}
                      onArquivoSelecionado={(arquivo) =>
                        atualizarDocumento(index, 'cnh', arquivo)
                      }
                      rotulo={`CNH do condutor ${index + 1} — tipo B ou superior`}
                    />
                  </div>
                </article>
              ))}
            </>
          )}

          {erro && (
            <div className="etapa-erro-caixa" role="alert">
              <IconeAlerta />
              <p>{erro}</p>
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
              Quando os documentos dos condutores estiverem enviados, a etapa{' '}
              {numeroProxima}
              {tituloProxima ? ` (${tituloProxima})` : ''} será liberada.
            </p>

            <button
              type="button"
              className="etapa-concluir-botao"
              disabled={erros.length > 0}
              onClick={handleConcluir}
            >
              {erros.length > 0 && <IconeCadeado />}
              Concluir etapa {numeroEtapa}
            </button>

            <span className="etapa-concluir-info">
              {erros.length === 0
                ? 'Todos os documentos enviados'
                : `Faltam ${erros.length} documento${
                    erros.length === 1 ? '' : 's'
                  }`}
            </span>
          </section>

          <section className="etapa-aviso">
            <IconeInfo />

            <p>
              Os arquivos devem estar legíveis e nos formatos PDF, JPG ou PNG.
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

            <h2 id="etapa-concluida-titulo">Etapa {numeroEtapa} concluída!</h2>

            <p className="etapa-concluida-texto">
              Os documentos dos condutores foram enviados.
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