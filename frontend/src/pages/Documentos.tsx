import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';

import './Documentos.css';

interface DocumentosProps {
  aoSair: () => void | Promise<void>;
  aoNavegar?: (destino: DestinoMenu) => void;
  irParaEtapa: () => void;
}

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

export default function Documentos({
  aoSair,
  aoNavegar,
  irParaEtapa,
}: DocumentosProps) {
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

        {/*
          Por enquanto só existe o estado vazio: os documentos enviados na
          etapa ainda não são guardados em nenhum lugar. Quando existir uma
          API de documentos, a lista entra aqui.
        */}
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
      </main>
    </PainelLayout>
  );
}