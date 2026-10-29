import { useEffect, useState } from 'react';
import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';

import './Overview.css';

interface OverviewProps {
  aoSair: () => void | Promise<void>;
  // Chamado ao clicar em "Começar" na etapa atual
  aoComecarEtapa?: () => void;
  aoNavegar?: (destino: DestinoMenu) => void;
}

const etapas = [
  {
    numero: '1',
    icone: (
      <svg width="39" height="28" viewBox="0 0 39 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20.055 8.50503H30.555M20.055 14.805H30.555M20.055 21.105H26.355M4.305 22.155C5.355 16.905 15.855 16.905 16.905 22.155M1.155 1.15503H36.855V26.355H1.155V1.15503ZM6.405 10.605C6.405 8.28537 8.28534 6.40503 10.605 6.40503C12.9247 6.40503 14.805 8.28537 14.805 10.605C14.805 12.9247 12.9247 14.805 10.605 14.805C8.28534 14.805 6.405 12.9247 6.405 10.605Z"
          strokeWidth="2.31"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="currentColor"
        />
      </svg>
    ),
    titulo: 'Identificação',
    documentos: [
      'Documento de identidade (RG ou CNH)',
      'CPF ativo',
      'Comprovante de endereço (até 90 dias)',
    ],
    atual: true,
  },
  {
    numero: '2',
    icone: (
      <svg width="29" height="39" viewBox="0 0 29 39" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M27.405 9.55503L19.005 1.15503H1.15503V36.855H27.405V9.55503ZM19.005 1.15503V9.55503H27.405M13.755 15.855V22.155M13.755 22.155V28.455M13.755 22.155H7.45503M13.755 22.155H20.055"
          strokeWidth="2.31"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="#7D8FA6"
        />
      </svg>
    ),
    titulo: 'Documentos médicos',
    documentos: [
      'Laudo médico com CID e caracterização da deficiência',
      'Audiograma (perda auditiva bilateral)',
    ],
  },
  {
    numero: '3',
    icone: (
      <svg width="37" height="31" viewBox="0 0 37 31" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1.15503 29.505C1.15503 21.105 5.35503 16.905 11.655 16.905C14.805 16.905 16.905 17.955 18.48 19.53C20.055 17.955 22.155 16.905 25.305 16.905C31.605 16.905 35.805 21.105 35.805 29.505M6.40503 6.40503C6.40503 3.50545 8.75546 1.15503 11.655 1.15503C14.5546 1.15503 16.905 3.50545 16.905 6.40503C16.905 9.3046 14.5546 11.655 11.655 11.655C8.75546 11.655 6.40503 9.3046 6.40503 6.40503ZM20.055 6.40503C20.055 3.50545 22.4055 1.15503 25.305 1.15503C28.2046 1.15503 30.555 3.50545 30.555 6.40503C30.555 9.3046 28.2046 11.655 25.305 11.655C22.4055 11.655 20.055 9.3046 20.055 6.40503Z"
          strokeWidth="2.31"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="#7D8FA6"
        />
      </svg>
    ),
    titulo: 'Condutores autorizados',
    documentos: [
      'CNH dos 2 condutores (válida e na categoria certa)',
      'Comprovante de vínculo com cada condutor',
    ],
  },
  {
    numero: '4',
    icone: (
      <svg width="39" height="34" viewBox="0 0 39 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M31.605 11.655H35.805L19.005 1.15503L2.20503 11.655H6.40503M31.605 11.655H23.205M31.605 11.655V28.455M23.205 11.655H14.805M23.205 11.655V28.455M14.805 11.655H6.40503M14.805 11.655V28.455M6.40503 11.655V28.455M1.15503 32.655H36.855"
          strokeWidth="2.31"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="#7D8FA6"
        />
      </svg>
    ),
    titulo: 'Renda e acesso gov.br',
    documentos: [
      'Declaração do Imposto de Renda (dispensada se financiar)',
      'Conta gov.br nível bronze ou superior',
    ],
  },
  {
    numero: '5',
    icone: (
      <svg width="36" height="25" viewBox="0 0 36 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M31.605 17.955H34.755V10.605L29.505 1.15503H6.405L1.155 10.605V17.955H4.305M31.605 17.955H26.355M31.605 17.955V23.205H26.355V17.955M26.355 17.955H9.555M9.555 17.955H4.305M9.555 17.955V23.205H4.305V17.955M2.205 10.605H33.705"
          strokeWidth="2.31"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="#7D8FA6"
        />
      </svg>
    ),
    titulo: 'Dados do veículo',
    documentos: [
      'Modelo 0 km dentro dos requisitos',
      'Valor estimado de até R$ 200 mil',
    ],
  },
  {
    numero: '6',
    icone: (
      <svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M24.255 4.30503V1.15503H7.45503V4.30503M24.255 4.30503V11.655C24.255 17.955 20.055 22.155 15.855 22.155M24.255 4.30503H30.555C30.555 10.605 28.455 12.705 24.255 12.705M15.855 22.155C11.655 22.155 7.45503 17.955 7.45503 11.655V4.30503M15.855 22.155V29.505M7.45503 4.30503H1.15503C1.15503 10.605 3.25503 12.705 7.45503 12.705M15.855 29.505H23.205V34.755H8.50503V29.505H15.855Z"
          strokeWidth="2.31"
          strokeLinecap="round"
          strokeLinejoin="round"
          stroke="#7D8FA6"
        />
      </svg>
    ),
    titulo: 'Revisão e dossiê',
    documentos: [
      'Revisão final dos dados e documentos',
      'Dossiê organizado para download',
      'Guia de envio pelo SISEN (passo a passo)',
    ],
  },
];

interface RespostasQuiz {
  situacao?: string;
  categoria?: string;
  isencao?: string;
}

function lerRespostasQuiz(): RespostasQuiz {
  try {
    return JSON.parse(localStorage.getItem('respostasQuiz') || '{}');
  } catch {
    return {};
  }
}

function obterEtapas(respostas: RespostasQuiz) {
  const precisaDeCondutores =
    respostas.situacao === 'pcd-nao-condutor' ||
    respostas.situacao === 'responsavel';

  return etapas
    .filter(
      (etapa) =>
        etapa.titulo !== 'Condutores autorizados' ||
        precisaDeCondutores
    )
    .map((etapa, index) => ({
      ...etapa,
      numero: String(index + 1),
    }));
}

const categorias: Record<string, string> = {
  fisica: 'Deficiência física',
  visual: 'Deficiência visual',
  auditiva: 'Deficiência auditiva',
  intelectual: 'Deficiência intelectual',
  autismo: 'Autismo',
  'nao-tenho-certeza': 'Deficiência a confirmar',
};

export default function Overview({
  aoSair,
  aoComecarEtapa,
  aoNavegar,
}: OverviewProps) {
  const [respostas, setRespostas] = useState<RespostasQuiz>(lerRespostasQuiz);

  useEffect(() => {
    function atualizarRespostas() {
      setRespostas(lerRespostasQuiz());
    }

    window.addEventListener('storage', atualizarRespostas);
    window.addEventListener('respostasQuizAtualizadas', atualizarRespostas);

    return () => {
      window.removeEventListener('storage', atualizarRespostas);
      window.removeEventListener('respostasQuizAtualizadas', atualizarRespostas);
    };
  }, []);

  const etapasVisiveis = obterEtapas(respostas);

  const perfil =
    respostas.situacao === 'pcd-condutor'
      ? 'PcD condutor'
      : respostas.situacao === 'responsavel'
        ? 'Responsável'
        : 'PcD não condutor';

  const categoria = respostas.categoria
    ? categorias[respostas.categoria] || 'Perfil personalizado'
    : 'Perfil personalizado';

  const precisaDeCondutores =
    respostas.situacao === 'pcd-nao-condutor' ||
    respostas.situacao === 'responsavel';

  return (
    <PainelLayout aoSair={aoSair} aoNavegar={aoNavegar} itemAtivo="processo">
      <main className="overview-content">
        <section className="overview-main">
          <div className="overview-intro">
            <h1>
              Vamos organizar sua
              <span> documentação</span>
            </h1>

            <p>
              Siga as etapas no seu ritmo. Cada etapa concluída libera a próxima.
            </p>

            <div className="overview-tags">
              <span>Montado para você:</span>
              <b>{perfil}</b>
              <b>{categoria}</b>
              {precisaDeCondutores && <b>Condutores autorizados</b>}
              {respostas.isencao && (
                <b>
                  {respostas.isencao === 'sim'
                    ? 'Já possui isenção'
                    : respostas.isencao === 'sim-perdi'
                      ? 'Isenção anterior perdida'
                      : 'Primeira solicitação'}
                </b>
              )}
            </div>
          </div>

          <section className="overview-progress">
            <div className="overview-progress-icon">
              <svg width="18" height="25" viewBox="0 0 18 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.909973 23.31V11.41M0.909973 11.41V1.61003M0.909973 11.41H16.31L12.81 6.51003L16.31 1.61003H0.909973M0.909973 1.61003V0.910034" strokeWidth="1.82" strokeLinecap="round" strokeLinejoin="round" stroke="#16A095" />
              </svg>
            </div>

            <div className="overview-progress-info">
              <strong>Seu progresso</strong>
              <span>0 de {etapasVisiveis.length} etapas concluídas</span>
            </div>

            <div
              className="overview-progress-bar"
              role="progressbar"
              aria-label="Progresso do processo"
              aria-valuenow={0}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span />
            </div>

            <strong className="overview-progress-percent">0%</strong>
          </section>

          <section className="overview-steps">
            {etapasVisiveis.map((etapa) => (
              <article
                key={etapa.numero}
                className={`overview-step ${
                  etapa.atual ? 'overview-step-current' : ''
                }`}
              >
                <div className="overview-step-icon">{etapa.icone}</div>

                <span className="overview-step-number">{etapa.numero}</span>

                <div className="overview-step-info">
                  <h2>{etapa.titulo}</h2>
                  <ul>
                    {etapa.documentos.map((documento) => (
                      <li key={documento}>{documento}</li>
                    ))}
                  </ul>
                </div>

                {etapa.atual ? (
                  <button type="button" className="overview-start" onClick={aoComecarEtapa}>
                    Começar <span>→</span>
                  </button>
                ) : (
                  <span className="overview-lock" aria-label="Bloqueado">
                    <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 8H1V20H17V8H14M4 8H14M4 8V4C4 0 14 0 14 4V8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="#7D8FA6" />
                    </svg>
                  </span>
                )}
              </article>
            ))}
          </section>

          <p className="overview-saved">
            <span className="material-symbols-outlined">save</span>
            <span>
              Seu progresso é salvo automaticamente. Você pode sair e
              continuar depois de onde parou.
            </span>
          </p>
        </section>

        <aside className="overview-right">
          <section className="overview-how">
            <h2>Como funciona?</h2>

            <div className="overview-explanation">
              <span>
                <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.51003 12.1099L10.71 16.3099L18.41 7.90991M0.910034 12.1099C0.910034 5.92415 5.92427 0.909912 12.11 0.909912C18.2958 0.909912 23.31 5.92415 23.31 12.1099C23.31 18.2957 18.2958 23.3099 12.11 23.3099C5.92427 23.3099 0.910034 18.2957 0.910034 12.1099Z" strokeWidth="1.82" strokeLinecap="round" strokeLinejoin="round" stroke="#16A095" />
                </svg>
              </span>
              <div>
                <strong>Complete cada etapa</strong>
                <p>
                  Envie os documentos pedidos. Cada etapa concluída libera a próxima.
                </p>
              </div>
            </div>

            <div className="overview-explanation">
              <span>
                <svg width="20" height="26" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.41 6.50991L12.81 0.909912H0.910034V24.7099H18.41V6.50991ZM12.81 0.909912V6.50991H18.41M5.11003 14.2099L7.91003 17.0099L14.21 10.7099" strokeWidth="1.82" strokeLinecap="round" strokeLinejoin="round" stroke="#16A095" />
                </svg>
              </span>
              <div>
                <strong>Confira antes de avançar</strong>
                <p>
                  Validamos datas e campos para evitar o indeferimento por erro simples.
                </p>
              </div>
            </div>

            <div className="overview-explanation">
              <span>
                <svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.81003 12.81L9.31003 16.31L15.61 9.31003M10.71 0.910034L20.51 5.11003V12.11C20.51 18.41 16.31 22.61 10.71 24.71C5.11003 22.61 0.910034 18.41 0.910034 12.11V5.11003L10.71 0.910034Z" strokeWidth="1.82" strokeLinecap="round" strokeLinejoin="round" stroke="#16A095" />
                </svg>
              </span>
              <div>
                <strong>Envie pelo SISEN</strong>
                <p>
                  No fim, você recebe o dossiê pronto e o guia para enviar à Receita Federal.
                </p>
              </div>
            </div>

            <div className="overview-illustration">
              <picture>
                <source srcSet="/mulher-com-prancheta.webp" type="image/webp" />
                <img
                  src="/mulher-com-prancheta.png"
                  alt="Mulher cadeirante com prancheta conferindo a documentação do processo de isenção"
                  width={1315}
                  height={1197}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
          </section>

          <section className="overview-deadlines">
            <h2>Prazos importantes</h2>

            <div>
              <b>~5 dias úteis</b>
              <span>Análise padrão da Receita Federal</span>
            </div>

            <div>
              <b>30 dias</b>
              <span>Para responder se a Receita pedir mais documentos</span>
            </div>

            <div>
              <b>270 dias</b>
              <span>Validade da autorização para comprar o veículo</span>
            </div>

            <div>
              <b>5 anos</b>
              <span>Prazo para usar a isenção de novo</span>
            </div>
          </section>
        </aside>
      </main>
    </PainelLayout>
  );
}