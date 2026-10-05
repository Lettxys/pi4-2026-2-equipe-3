import { useState, type ReactNode } from 'react';

interface QuizProps {
  voltarInicio: () => void;
  abrirLogin: () => void;
  concluir?: (respostas: Record<string, string>) => void;
  nenhumaOpcao?: () => void;
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  if (name === 'steering') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`h-[1em] w-[1em] ${className}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ fontSize: '1.875rem' }}
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M3.5 10.5c5-1.5 12-1.5 17 0M12 14.5V21" />
      </svg>
    );
  }
  return (
    <span className={`material-icons ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

interface Opcao {
  id: string;
  icon: string;
  titulo: string;
  descricao: string;
}

interface Pergunta {
  id: string;
  layout: 'vertical' | 'horizontal';
  antes: string;
  destaque: string;
  depois: string;
  descricao: string;
  opcoes: Opcao[];
  botao: string;
}

const perguntas: Pergunta[] = [
  {
    id: 'situacao',
    layout: 'vertical',
    antes: 'Qual é a sua ',
    destaque: 'situação',
    depois: '?',
    descricao:
      'Responda 3 perguntas rápidas e descubra se você tem direito à isenção de IPI na compra de um veículo 0 km.',
    botao: 'Continuar',
    opcoes: [
      {
        id: 'pcd-condutor',
        icon: 'steering',
        titulo: 'PcD condutor',
        descricao: 'Tenho deficiência e vou dirigir o veículo.',
      },
      {
        id: 'pcd-nao-condutor',
        icon: 'directions_car',
        titulo: 'PcD não condutor',
        descricao: 'Tenho deficiência, mas outra pessoa vai dirigir.',
      },
      {
        id: 'responsavel',
        icon: 'people_outline',
        titulo: 'Responsável ou condutor autorizado',
        descricao: 'Estou fazendo o processo por uma pessoa com deficiência.',
      },
    ],
  },
  {
    id: 'categoria',
    layout: 'horizontal',
    antes: 'Qual a ',
    destaque: 'categoria',
    depois: ' da deficiência?',
    descricao: 'Cada categoria tem critérios próprios. Se houver mais de uma, selecione a principal.',
    botao: 'Continuar',
    opcoes: [
      {
        id: 'fisica',
        icon: 'accessibility_new',
        titulo: 'Deficiência física',
        descricao: 'Paraplegia, amputações, monoparesia, hemiplegia, ostomia, nanismo, paralisia cerebral.',
      },
      {
        id: 'visual',
        icon: 'visibility',
        titulo: 'Deficiência visual',
        descricao: 'Cegueira ou baixa visão (acuidade ≤ 0,3 com correção, ou campo visual ≤ 60°).',
      },
      {
        id: 'auditiva',
        icon: 'hearing',
        titulo: 'Deficiência auditiva',
        descricao: 'Perda bilateral de 41 decibéis ou mais, comprovada por audiograma.',
      },
      {
        id: 'intelectual',
        icon: 'psychology',
        titulo: 'Intelectual severa ou profunda',
        descricao: 'Funcionamento intelectual abaixo da média, com manifestação antes dos 18 anos.',
      },
      {
        id: 'autismo',
        icon: 'all_inclusive',
        titulo: 'Autismo (TEA)',
        descricao: 'Transtorno do espectro autista, em qualquer grau (Lei 12.764/2012).',
      },
      {
        id: 'nao-tenho-certeza',
        icon: 'help_outline',
        titulo: 'Não tenho certeza',
        descricao: 'Minha condição não se encaixa claramente nas anteriores.',
      },
    ],
  },
  {
    id: 'isencao',
    layout: 'vertical',
    antes: 'Você usou a isenção nos ',
    destaque: 'últimos 3 anos',
    depois: '?',
    descricao:
      'A isenção de IPI pode ser usada uma vez a cada 3 anos. Há exceções em caso de roubo, furto ou perda total.',
    botao: 'Ver resultado',
    opcoes: [
      {
        id: 'nao',
        icon: 'event_available',
        titulo: 'Não',
        descricao: 'Nunca usei, ou a última compra com isenção foi há mais de 3 anos.',
      },
      {
        id: 'sim',
        icon: 'event_busy',
        titulo: 'Sim',
        descricao: 'Comprei um veículo com isenção há menos de 3 anos.',
      },
      {
        id: 'sim-perdi',
        icon: 'gpp_maybe',
        titulo: 'Sim, mas perdi o veículo',
        descricao: 'O veículo foi roubado, furtado ou teve perda total.',
      },
    ],
  },
];

export default function Quiz({ voltarInicio, abrirLogin, concluir, nenhumaOpcao }: QuizProps) {
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});

  const pergunta = perguntas[passo];
  const escolhida = respostas[pergunta.id];
  const ultima = passo === perguntas.length - 1;
  const horizontal = pergunta.layout === 'horizontal';

  function voltar() {
    if (passo === 0) voltarInicio();
    else setPasso((p) => p - 1);
  }

  function continuar() {
    if (!escolhida) return;
    if (ultima) concluir?.(respostas);
    else setPasso((p) => p + 1);
  }

  let rodapeEsquerdo: ReactNode = null;
  if (passo === 0) {
    rodapeEsquerdo = (
      <button
        onClick={nenhumaOpcao}
        className="text-xs font-medium text-[#1a9e94] underline underline-offset-2 hover:text-[#158a81]"
      >
        Nenhuma dessas opções se aplica a mim
      </button>
    );
  } else if (passo === 1 && respostas.situacao === 'pcd-condutor') {
    rodapeEsquerdo = (
      <p className="max-w-xl text-[11px] leading-relaxed text-[#4a5f7a]">
        Marcou "PcD condutor" e deficiência visual? Nesse caso, o veículo é conduzido por outra pessoa
        e você entra como PcD não condutor.
      </p>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f1f9f7] font-[Poppins,sans-serif] text-[#1b365d]">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-[#dff2ee]/80" />
      <div className="pointer-events-none absolute -bottom-48 -left-40 h-[32rem] w-[32rem] rounded-full bg-[#dff2ee]/80" />

      <header className="relative z-20 bg-white shadow-[0_6px_16px_-6px_rgba(27,54,93,0.12)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-2xl font-semibold text-[#1a9e94]">isenta+</span>
          <div className="flex items-center gap-4">
            <button onClick={voltarInicio} className="text-sm font-medium hover:text-[#1a9e94]">
              Início
            </button>
            <span className="h-6 w-px bg-[#d5e8e3]" />
            <button
              onClick={abrirLogin}
              className="rounded-full border border-[#1a9e94] px-5 py-1.5 text-sm font-medium text-[#1a9e94] hover:bg-[#e6f4f1]"
            >
              Entrar
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-10 pb-16">
        <section className="rounded-3xl bg-white p-8 shadow-[0_10px_30px_-12px_rgba(27,54,93,0.15)] md:p-10">
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={voltar}
              className="flex items-center gap-1.5 font-medium hover:text-[#1a9e94]"
            >
              <Icon name="arrow_back" className="!text-base" />
              Voltar
            </button>
            <span className="text-[#6b7f99]">
              Pergunta {passo + 1} de {perguntas.length}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={perguntas.length}
            aria-valuenow={passo + 1}
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#e1f0ec]"
          >
            <div
              className="h-full rounded-full bg-[#1a9e94] transition-all duration-500"
              style={{ width: `${((passo + 1) / perguntas.length) * 100}%` }}
            />
          </div>

          <p className="mt-8 mb-3 flex items-center gap-3 text-[10px] font-semibold tracking-[0.25em] text-[#2f63b5] uppercase">
            <span className="h-px w-6 bg-[#1a9e94]" /> Teste de elegibilidade
          </p>
          <h1 className="text-3xl font-semibold md:text-4xl">
            {pergunta.antes}
            <span className="text-[#1a9e94]">{pergunta.destaque}</span>
            {pergunta.depois}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#2f4f7f]">{pergunta.descricao}</p>

          <div
            role="radiogroup"
            aria-label={`${pergunta.antes}${pergunta.destaque}${pergunta.depois}`}
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {pergunta.opcoes.map((o) => {
              const ativa = escolhida === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={ativa}
                  onClick={() => setRespostas((r) => ({ ...r, [pergunta.id]: o.id }))}
                  className={`relative flex rounded-2xl border transition duration-200 ${
                    horizontal
                      ? 'min-h-28 flex-row items-center gap-4 px-5 py-5 text-left'
                      : 'min-h-52 flex-col items-center px-5 py-8 text-center'
                  } ${
                    ativa
                      ? 'border-[#1a9e94] bg-[#f1f9f7] shadow-[0_12px_28px_-12px_rgba(26,158,148,0.45)]'
                      : 'border-[#e3efec] bg-white hover:-translate-y-0.5 hover:border-[#9fd3c9] hover:shadow-[0_12px_28px_-14px_rgba(27,54,93,0.25)]'
                  }`}
                >
                  {ativa && (
                    <span className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-full bg-[#1a9e94] text-white">
                      <Icon name="check" className="!text-sm" />
                    </span>
                  )}
                  <span
                    className={`grid shrink-0 place-items-center rounded-full text-[#1a9e94] transition-colors ${
                      horizontal ? 'h-12 w-12' : 'h-16 w-16'
                    } ${ativa ? 'bg-[#cdeae4]' : 'bg-[#e1f4f0]'}`}
                  >
                    <Icon name={o.icon} className={horizontal ? '!text-2xl' : '!text-3xl'} />
                  </span>
                  <span className={`flex flex-col ${horizontal ? 'pr-4' : ''}`}>
                    <span
                      className={`leading-snug font-semibold ${
                        horizontal ? 'text-sm' : 'mt-5 text-base'
                      }`}
                    >
                      {o.titulo}
                    </span>
                    <span
                      className={`leading-relaxed text-[#4a5f7a] ${
                        horizontal ? 'mt-1 text-[11px]' : 'mt-2 text-xs'
                      }`}
                    >
                      {o.descricao}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div>{rodapeEsquerdo}</div>
            <button
              onClick={continuar}
              disabled={!escolhida}
              className="ml-auto flex items-center gap-2 rounded-xl bg-[#1a9e94] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#158a81] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#1a9e94]"
            >
              {pergunta.botao}
              <Icon name="arrow_forward" className="!text-xl" />
            </button>
          </div>
        </section>

        <aside className="mt-6 flex items-start gap-3 px-2 text-[11px] leading-relaxed text-[#6b7f99]">
          <Icon name="info_outline" className="!text-lg text-[#9fb3c8]" />
          <p>
            <strong className="text-[#1b365d]">Aviso.</strong> Este quiz é uma ferramenta orientativa
            baseada nos critérios objetivos da Lei 8.989/95 e legislação correlata. O resultado não tem
            valor jurídico vinculante e não substitui consulta profissional. Casos limítrofes
            (deficiências em recuperação, condições raras, situações específicas de cooperativa) podem
            exigir análise individualizada.
          </p>
        </aside>
      </main>
    </div>
  );
}