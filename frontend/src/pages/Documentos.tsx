import { useEffect, useState } from 'react';

import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';
import { listarDocumentos } from '../services/documentosSalvos';
import type { DocumentoSalvo } from '../services/documentosSalvos';

import './Documentos.css';
import './DocumentosLista.css';

interface DocumentosProps {
  aoSair: () => void | Promise<void>;
  aoNavegar?: (destino: DestinoMenu) => void;
  irParaEtapa: () => void;
}

interface GrupoEtapa {
  etapa: string;
  titulo: string;
  documentos: DocumentoSalvo[];
}

const ORDEM_ETAPAS = ['identificacao', 'documentos-medicos', 'renda', 'veiculo'];

function IconePasta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 13h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeSeta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12h16M14 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatarData(iso: string): string {
  const data = new Date(iso);

  return Number.isNaN(data.getTime()) ? '' : data.toLocaleDateString('pt-BR');
}

function agruparPorEtapa(documentos: DocumentoSalvo[]): GrupoEtapa[] {
  const grupos = new Map<string, GrupoEtapa>();

  for (const documento of documentos) {
    const grupo = grupos.get(documento.etapa) ?? {
      etapa: documento.etapa,
      titulo: documento.etapaTitulo,
      documentos: [],
    };

    grupo.documentos.push(documento);
    grupos.set(documento.etapa, grupo);
  }

  const posicao = (etapa: string) => {
    const indice = ORDEM_ETAPAS.indexOf(etapa);
    return indice < 0 ? ORDEM_ETAPAS.length : indice;
  };

  return Array.from(grupos.values()).sort(
    (a, b) => posicao(a.etapa) - posicao(b.etapa)
  );
}

function verDocumento(documento: DocumentoSalvo) {
  const endereco = URL.createObjectURL(documento.arquivo);
  window.open(endereco, '_blank', 'noopener');
}

function baixarDocumento(documento: DocumentoSalvo) {
  const endereco = URL.createObjectURL(documento.arquivo);
  const link = document.createElement('a');

  link.href = endereco;
  link.download = documento.nome;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(endereco), 1000);
}

export default function Documentos({
  aoSair,
  aoNavegar,
  irParaEtapa,
}: DocumentosProps) {
  const [documentos, setDocumentos] = useState<DocumentoSalvo[] | null>(null);

  useEffect(() => {
    let ativo = true;

    void listarDocumentos().then((lista) => {
      if (ativo) {
        setDocumentos(lista);
      }
    });

    return () => {
      ativo = false;
    };
  }, []);

  const grupos = documentos ? agruparPorEtapa(documentos) : [];

  return (
    <PainelLayout
      aoSair={aoSair}
      aoNavegar={aoNavegar}
      itemAtivo="documentos"
      caminho={['Visão geral', 'Documentos']}
    >
      <main className="documentos-content">
        <h1>Documentos</h1>

        <p className="documentos-subtitulo">
          Todos os arquivos enviados nas etapas ficam reunidos aqui.
        </p>

        {documentos === null && (
          <p className="documentos-subtitulo">Carregando seus documentos...</p>
        )}

        {documentos !== null && documentos.length === 0 && (
          <section className="documentos-vazio">
            <div className="documentos-vazio-icone">
              <IconePasta />
            </div>

            <h2>Nenhum documento enviado ainda</h2>

            <p>
              Os arquivos que você enviar nas etapas aparecem aqui, organizados
              por etapa e com a situação de cada um.
            </p>

            <button type="button" onClick={irParaEtapa}>
              Ir para a etapa 1
              <IconeSeta />
            </button>
          </section>
        )}

        {grupos.map((grupo) => (
          <section key={grupo.etapa} className="documentos-grupo">
            <h2>
              {grupo.titulo}
              <span>
                {grupo.documentos.length}{' '}
                {grupo.documentos.length === 1 ? 'documento' : 'documentos'}
              </span>
            </h2>

            <ul className="documentos-lista">
              {grupo.documentos.map((documento) => (
                <li key={documento.id} className="documentos-item">
                  <span className="documentos-item-icone">
                    <IconeDocumento />
                  </span>

                  <div className="documentos-item-texto">
                    <strong>{documento.titulo}</strong>
                    <span>
                      {documento.nome} · {formatarTamanho(documento.tamanho)} · Enviado em{' '}
                      {formatarData(documento.enviadoEm)}
                    </span>
                  </div>

                  <span className="documentos-item-selo">Conferido</span>

                  <div className="documentos-item-acoes">
                    <button type="button" onClick={() => verDocumento(documento)}>
                      Ver
                    </button>
                    <button type="button" onClick={() => baixarDocumento(documento)}>
                      Baixar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </PainelLayout>
  );
}