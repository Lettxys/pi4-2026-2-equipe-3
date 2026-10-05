import { useState } from 'react';

interface LandingProps {
  abrirLogin: () => void;
  abrirRegistrar: () => void;
  abrirQuiz?: () => void;
  abrirCalculadora?: () => void;
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-icons ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

const beneficios = [
  { icon: 'checklist', texto: 'Etapas guiadas' },
  { icon: 'description', texto: 'Documentos organizados' },
  { icon: 'person_add_alt', texto: 'Mais autonomia' },
];

const passos = [
  {
    icon: 'person_outline',
    texto: 'Entenda seu perfil',
    descricao: 'Identifique se você é PcD condutor, PcD não condutor ou condutor autorizado.',
  },
  {
    icon: 'description',
    texto: 'Separe os documentos',
    descricao: 'Veja quais documentos você precisa reunir para o seu perfil.',
  },
  {
    icon: 'task_alt',
    texto: 'Preencha e valide',
    descricao: 'Preencha as informações do pedido e confira se está tudo certo.',
  },
  {
    icon: 'folder_open',
    texto: 'Revise e conclua',
    descricao: 'Revise os dados e finalize o seu pedido.',
  },
];

const BRAND = 'bg-[#1a9e94] hover:bg-[#158a81] text-white';
const BRAND_CARD = 'bg-[#1a9e94] text-white hover:bg-[#0f7f77] group-hover:bg-[#0f7f77]';

export default function Landing({
  abrirLogin,
  abrirRegistrar,
  abrirQuiz,
  abrirCalculadora,
}: LandingProps) {
  const [escala, setEscala] = useState(100);

  function ajustarFonte(delta: number) {
    const nova = Math.min(130, Math.max(85, escala + delta));
    setEscala(nova);
    document.documentElement.style.fontSize = `${nova}%`;
  }

  return (
    <div className="min-h-screen bg-[#fbfdfc] font-[Poppins,sans-serif] text-[#1b365d]">
      <header className="sticky top-0 z-20 border-b border-[#e3efec] bg-[#fbfdfc]/95 shadow-[0_6px_16px_-6px_rgba(27,54,93,0.18)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-10">
            <span className="text-2xl font-semibold text-[#1a9e94]">isenta+</span>
            <nav className="hidden gap-6 text-sm sm:flex">
              <a href="#como-funciona" className="hover:text-[#1a9e94]">Como funciona</a>
              <a href="#ferramentas" className="hover:text-[#1a9e94]">Ferramentas</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 text-xs sm:flex" aria-label="Tamanho da fonte">
              <button onClick={() => ajustarFonte(-5)} className="rounded px-1.5 py-0.5 hover:bg-[#e6f4f1]" aria-label="Diminuir fonte">A-</button>
              <button onClick={() => ajustarFonte(5)} className="rounded px-1.5 py-0.5 hover:bg-[#e6f4f1]" aria-label="Aumentar fonte">A+</button>
            </div>
            <button
              onClick={abrirLogin}
              className="rounded-full border border-[#1a9e94] px-5 py-1.5 text-sm font-medium text-[#1a9e94] hover:bg-[#e6f4f1]"
            >
              Entrar
            </button>
            <button
              onClick={abrirRegistrar}
              className={`rounded-full px-5 py-1.5 text-sm font-medium ${BRAND}`}
            >
              Começar
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="flex min-h-[calc(100svh-5.2rem),70rem] flex-col">
        <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-6 py-14 md:grid-cols-2">
          <div>
            <h1 className="text-4xl leading-tight font-semibold md:text-5xl">
              Seu direito à isenção,
              <br />
              <span className="text-[#1a9e94]">sem complicação.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#4a5f7a]">
              Um guia prático para organizar documentos e preparar seu pedido de
              isenção na compra de um veículo 0 km.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <button
                onClick={abrirRegistrar}
                className={`rounded-lg px-6 py-3 text-sm font-semibold ${BRAND}`}
              >
                Começar meu processo
              </button>
              <a
                href="#como-funciona"
                className="flex items-center gap-1 text-sm font-medium text-[#1a9e94]"
              >
                Entendo como funciona
                <Icon name="arrow_forward" className="!text-base" />
              </a>
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs text-[#4a5f7a]">
              <Icon name="verified_user" className="!text-base text-[#1a9e94]" />
              Seus dados protegidos. Você no controle.
            </p>
          </div>

          <img
            src="/ilustracao-hero.svg"
            alt="Mulher cadeirante ao lado de um carro, com uma lista de etapas concluídas"
            className="mx-auto w-full max-w-lg"
          />
        </section>

        <section className="w-full bg-[#e6f4f1]">
          <ul className="mx-auto grid max-w-6xl divide-[#cfe6e1] px-6 py-5 sm:grid-cols-3 sm:divide-x">
            {beneficios.map((b) => (
              <li key={b.texto} className="flex items-center justify-center gap-3 py-2 text-sm font-medium">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d3ece7]">
                  <Icon name={b.icon} className="text-[#1a9e94]" />
                </span>
                {b.texto}
              </li>
            ))}
          </ul>
        </section>
        </div>

        <section id="como-funciona" className="mx-auto grid max-w-6xl scroll-mt-20 items-center gap-10 px-6 pt-20 pb-36 md:grid-cols-2">
          <img
            src="/ilustracao-como-funciona.svg"
            alt="Mulher cadeirante usando um tablet, cercada por ícones de laudo, CNH, órgãos e concessionária"
            className="mx-auto w-full max-w-md"
          />
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-[#1a9e94]">
              <span className="h-px w-6 bg-[#1a9e94]" /> Como funciona
            </p>
            <h2 className="text-2xl leading-snug font-semibold md:text-3xl">
              A isenção de IPI é <span className="text-[#1a9e94]">um direito</span> e
              conhecer o caminho <span className="text-[#1a9e94]">facilita</span> o
              acesso a ele.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#4a5f7a]">
              Para solicitar a isenção na compra de um veículo 0 km, é preciso reunir
              documentos, preencher informações e cumprir exigências de diferentes
              etapas. A plataforma organiza esse caminho de forma simples, para que
              você saiba o que fazer em cada momento.
            </p>

            <ol className="relative mt-6 grid grid-cols-2 gap-x-3 gap-y-6 pt-3 sm:grid-cols-4">
              <li aria-hidden="true" className="absolute top-[3.625rem] right-[12.5%] left-[12.5%] hidden h-px bg-[#1a9e94]/40 sm:block" />
              {passos.map((p, i) => (
                <li key={p.texto} className="group relative h-36 hover:z-10 focus-within:z-10">
                  <div
                    tabIndex={0}
                    className="absolute inset-x-0 top-0 flex flex-col items-center rounded-xl bg-[#e6f4f1] px-3 pt-6 pb-4 text-center outline-none transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-[#dff3ef] group-hover:shadow-[0_12px_28px_-8px_rgba(26,158,148,0.35)] focus:bg-[#dff3ef] focus:shadow-[0_12px_28px_-8px_rgba(26,158,148,0.35)] motion-reduce:transition-none"
                  >
                    <span className="absolute -top-3 grid h-7 w-7 place-items-center rounded-full bg-[#1a9e94] text-xs font-semibold text-white transition-transform duration-300 group-hover:scale-110">
                      {i + 1}
                    </span>
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#d3ece7] transition-colors duration-300 group-hover:bg-[#c5e8e1]">
                      <Icon name={p.icon} className="text-[#1a9e94]" />
                    </span>
                    <span className="mt-3 text-xs font-semibold">{p.texto}</span>
                    <span className="grid grid-rows-[0fr] text-[11px] leading-relaxed text-[#4a5f7a] transition-all duration-300 group-hover:grid-rows-[1fr] group-hover:pt-2 group-focus-within:grid-rows-[1fr] group-focus-within:pt-2">
                      <span className="overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                        {p.descricao}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-[#e6f4f1]">
          <p className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4 text-xs text-[#4a5f7a]">
            <Icon name="info" className="text-[#1a9e94]" />
            A plataforma organiza e orienta o processo; a análise e o deferimento
            continuam sob responsabilidade dos órgãos competentes.
          </p>
        </section>

        <section id="ferramentas" className="mx-auto max-w-4xl scroll-mt-20 px-6 pt-20 pb-44">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium text-[#1a9e94]">
            <span className="h-px w-6 bg-[#1a9e94]" /> Ferramentas
          </p>
          <h2 className="text-2xl font-semibold md:text-3xl">
            Explore <span className="text-[#1a9e94]">em prática</span>
            <br />o que se aplica a você.
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="group rounded-2xl border border-[#e3efec] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#bfe3dc] hover:bg-[#ddf1ed] hover:shadow-[0_16px_32px_-10px_rgba(26,158,148,0.35)] motion-reduce:transition-none">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e6f4f1] transition-colors duration-300 group-hover:bg-[#cdeae4]">
                  <Icon name="fact_check" className="text-[#1a9e94]" />
                </span>
                <span className="rounded-full bg-[#e6f4f1] px-2 py-0.5 text-[10px] font-medium text-[#1a9e94]">
                  3 minutos
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Quiz de elegibilidade</h3>
              <p className="mt-2 text-sm text-[#4a5f7a]">
                Responda algumas perguntas e descubra se você se enquadra como PcD
                ou taxista, e qual caminho seguir.
              </p>
              <button
                onClick={abrirQuiz}
                className={`mt-5 inline-flex items-center gap-1 rounded-md px-4 py-2 text-xs font-semibold transition-colors duration-300 ${BRAND_CARD}`}
              >
                Iniciar quiz <Icon name="arrow_forward" className="!text-sm" />
              </button>
            </article>

            <article className="group rounded-2xl border border-[#e3efec] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#bfe3dc] hover:bg-[#ddf1ed] hover:shadow-[0_16px_32px_-10px_rgba(26,158,148,0.35)] motion-reduce:transition-none">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e6f4f1] transition-colors duration-300 group-hover:bg-[#cdeae4]">
                  <Icon name="calculate" className="text-[#1a9e94]" />
                </span>
                <span className="rounded-full bg-[#e6f4f1] px-2 py-0.5 text-[10px] font-medium text-[#1a9e94]">
                  Estimativa
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Calculadora de economia</h3>
              <p className="mt-2 text-sm text-[#4a5f7a]">
                Informe o valor do veículo e descubra quanto você economiza em IPI.
                Considera também o impacto do ICMS estadual.
              </p>
              <button
                onClick={abrirCalculadora}
                className={`mt-5 inline-flex items-center gap-1 rounded-md px-4 py-2 text-xs font-semibold transition-colors duration-300 ${BRAND_CARD}`}
              >
                Calcular <Icon name="arrow_forward" className="!text-sm" />
              </button>
            </article>
          </div>
        </section>
      </main>

      <footer className="bg-[#1b365d] text-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="max-w-3xl text-xs leading-relaxed text-white/80">
            <strong>Iniciativa educacional independente.</strong> As informações
            contidas neste site têm um caráter informativo e auxiliar, porém não
            substituem uma consulta jurídica personalizada. As informações foram
            estruturadas com base na legislação atual e em fontes oficiais.
          </p>
          <div className="mt-6 flex items-center justify-between text-xs">
            <span className="text-lg font-semibold text-[#3fc7b9]">isenta+</span>
            <span className="text-white/60">© 2026 isenta+. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}