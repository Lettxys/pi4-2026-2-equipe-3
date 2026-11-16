import { useEffect, useRef, useState } from 'react';

interface QuizSemPerfilProps {
  voltarInicio: () => void;
  refazerQuiz: () => void;
  revisar: () => void;
  abrirConta?: () => void;
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-icons ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

export default function QuizSemPerfil({
  voltarInicio,
  refazerQuiz,
  revisar,
  abrirConta,
}: QuizSemPerfilProps) {
  const [confirmando, setConfirmando] = useState(false);
  const botaoConfirmar = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!confirmando) {
      return;
    }

    botaoConfirmar.current?.focus();

    function aoTeclar(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setConfirmando(false);
      }
    }

    window.addEventListener('keydown', aoTeclar);

    return () => {
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [confirmando]);

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
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-[0_10px_30px_-12px_rgba(27,54,93,0.15)] md:p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e8edf3] text-[#5b7090]">
            <Icon name="info_outline" className="!text-3xl" />
          </span>

          <p className="mt-6 text-[10px] font-semibold tracking-[0.25em] text-[#2f63b5] uppercase">
            Resultado
          </p>

          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Você <span className="text-[#5b7090]">não se enquadra</span> nos perfis.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#2f4f7f]">
            A isenção desta plataforma é voltada a pessoas com deficiência, seus responsáveis e
            condutores autorizados. Se algo mudou ou você marcou uma opção por engano, é só refazer
            o quiz.
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

          <div className="mt-3 flex justify-center">
            <span className="rounded-full bg-[#e1f4f0] px-4 py-1.5 text-xs font-medium text-[#0f7a70]">
              Nenhuma das opções
            </span>
          </div>

          <div className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-xl border border-[#f3dfb0] bg-[#fff6e5] px-4 py-3 text-left text-xs leading-relaxed text-[#8a5d00]">
            <Icon name="lock_outline" className="!text-lg text-[#d29a1f]" />
            <p>
              O passo a passo de documentos fica disponível quando o quiz indicar que você tem
              direito à isenção. Suas respostas continuam salvas.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setConfirmando(true)}
              className="flex items-center gap-2 rounded-xl bg-[#1a9e94] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#158a81]"
            >
              Refazer quiz
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

      {confirmando && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#1b365d]/55 px-4"
          onClick={() => setConfirmando(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="refazer-titulo"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_20px_50px_rgba(27,54,93,0.35)]"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fff1d6] text-[#e0a526]">
              <Icon name="error_outline" className="!text-2xl" />
            </span>

            <h2 id="refazer-titulo" className="mt-4 text-xl font-semibold">
              Refazer o quiz?
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-[#2f4f7f]">
              Suas respostas atuais serão substituídas. O passo a passo de documentos será montado
              de novo com base nas novas respostas.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmando(false)}
                className="rounded-xl border border-[#1a9e94] bg-white px-5 py-2.5 text-sm font-semibold text-[#1a9e94] transition hover:bg-[#f1f9f7]"
              >
                Cancelar
              </button>
              <button
                ref={botaoConfirmar}
                onClick={refazerQuiz}
                className="rounded-xl bg-[#1a9e94] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#158a81]"
              >
                Refazer
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}