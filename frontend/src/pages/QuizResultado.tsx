import { montarPerfil } from '../services/regrasPerfil';
import type { RespostasPerfil } from '../services/regrasPerfil';

interface QuizResultadoProps {
  respostas: RespostasPerfil;
  voltarInicio: () => void;
  revisar: () => void;
  verPassoAPasso: () => void;
  abrirConta?: () => void;
}

const REQUISITOS_VEICULO = [
  '0 km',
  'Fabricado ou montado no Brasil',
  'Motor até 2.0',
  'Mínimo de 4 portas',
  'Até R$ 200 mil',
  'Flex, renovável, híbrido ou elétrico',
];

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-icons ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

export default function QuizResultado({
  respostas,
  voltarInicio,
  revisar,
  verPassoAPasso,
  abrirConta,
}: QuizResultadoProps) {
  const perfil = montarPerfil(respostas);

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
            {abrirConta && (
              <>
                <span className="h-6 w-px bg-[#d5e8e3]" />
                <button
                  onClick={abrirConta}
                  className="text-sm font-medium text-[#1a9e94] hover:text-[#158a81]"
                >
                  Minha conta
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-10 pb-16">
        <section className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-center shadow-[0_10px_30px_-12px_rgba(27,54,93,0.15)] md:p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e1f4f0] text-[#1a9e94]">
            <Icon name="check" className="!text-3xl" />
          </span>

          <p className="mt-6 text-[10px] font-semibold tracking-[0.25em] text-[#2f63b5] uppercase">
            Resultado
          </p>

          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Você tem <span className="text-[#1a9e94]">direito</span> à isenção.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#2f4f7f]">
            {perfil.textoResumo}
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#6b7f99]">
            <span>Suas respostas</span>
            <button
              onClick={revisar}
              className="font-medium text-[#1a9e94] underline underline-offset-2 hover:text-[#158a81]"
            >
              Revisar
            </button>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {perfil.tagsResumo.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#e1f4f0] px-4 py-1.5 text-xs font-medium text-[#0f7a70]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-3xl rounded-xl bg-[#f1f9f7] px-6 py-5">
            <p className="text-xs font-semibold">
              Lembre-se: o veículo também precisa cumprir os requisitos
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {REQUISITOS_VEICULO.map((requisito) => (
                <span
                  key={requisito}
                  className="rounded-full border border-[#d5e8e3] bg-white px-4 py-1.5 text-xs font-medium"
                >
                  {requisito}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={verPassoAPasso}
              className="flex items-center gap-2 rounded-xl bg-[#1a9e94] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#158a81]"
            >
              Ver meu passo a passo
              <Icon name="arrow_forward" className="!text-xl" />
            </button>
          </div>
        </section>

        <aside className="mt-6 flex items-start gap-3 px-2 text-[11px] leading-relaxed text-[#6b7f99]">
          <Icon name="info_outline" className="!text-lg text-[#9fb3c8]" />
          <p>
            <strong className="text-[#1b365d]">Aviso.</strong> Este quiz é uma ferramenta
            orientativa baseada nos critérios objetivos da Lei 8.989/95 e legislação correlata. O
            resultado não tem valor jurídico vinculante e não substitui consulta profissional. Casos
            limítrofes (deficiências em recuperação, condições raras, situações específicas de
            cooperativa) podem exigir análise individualizada.
          </p>
        </aside>
      </main>
    </div>
  );
}