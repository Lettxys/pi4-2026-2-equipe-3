import { useEffect, useMemo, useRef, useState } from 'react';

interface CalculadoraProps {
  voltarInicio: () => void;
  abrirLogin: () => void;
  abrirQuiz?: () => void;
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-icons ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

const TETO = 200000;

const perfis = [
  { id: 'sustentavel', nome: 'Carro Sustentável (1.0 flex compacto, IPI zero)', ipi: 0 },
  { id: 'flex75', nome: '1.0 flex até 75 cv', ipi: 3 },
  { id: 'turbo', nome: '1.0 flex turbo', ipi: 5 },
  { id: 'flex2', nome: 'Flex acima de 1.0 e até 2.0', ipi: 7.05 },
  { id: 'mhev', nome: 'Híbrido leve (MHEV)', ipi: 6 },
  { id: 'hev', nome: 'Híbrido pleno (HEV/PHEV)', ipi: 4 },
  { id: 'eletrico', nome: 'Elétrico', ipi: 0 },
  { id: 'outros', nome: 'Outros (alíquota base)', ipi: 11 },
];

const numero = (v: number, casas = 2) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

const moeda = (v: number) => `R$ ${numero(v)}`;

const LABEL = 'text-xs font-semibold tracking-[0.2em] text-[#2f63b5] uppercase';
const CAMPO =
  'flex items-center gap-3 rounded-2xl border bg-[#f1f9f7] px-5 py-3 transition focus-within:border-[#1a9e94] focus-within:ring-4 focus-within:ring-[#1a9e94]/15';

function SeletorPerfil({ valor, onChange }: { valor: string; onChange: (id: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const atual = perfis.find((p) => p.id === valor) ?? perfis[0];

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false);
    }
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
        className={`flex w-full items-center justify-between rounded-2xl border bg-white px-5 py-3.5 text-left text-base transition ${
          aberto
            ? 'border-[#1a9e94] ring-4 ring-[#1a9e94]/15'
            : 'border-[#d5e8e3] hover:border-[#9fd3c9]'
        }`}
      >
        {atual.nome}
        <Icon
          name="expand_more"
          className={`text-[#1b365d] transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {aberto && (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-[#e3efec] bg-white py-2 shadow-[0_16px_40px_-12px_rgba(27,54,93,0.3)]"
        >
          {perfis.map((p) => {
            const selecionado = p.id === valor;
            return (
              <li key={p.id} role="option" aria-selected={selecionado}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setAberto(false);
                  }}
                  className={`flex w-full items-center justify-between px-5 py-2.5 text-left text-sm transition ${
                    selecionado
                      ? 'bg-[#e1f4f0] font-medium text-[#1a9e94]'
                      : 'hover:bg-[#f1f9f7]'
                  }`}
                >
                  {p.nome}
                  {selecionado && <Icon name="check" className="!text-xl" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Calculadora({ voltarInicio, abrirLogin, abrirQuiz }: CalculadoraProps) {
  const [centavos, setCentavos] = useState(8000000);
  const [perfilId, setPerfilId] = useState('flex2');
  const [icmsTxt, setIcmsTxt] = useState('12,00');
  const campoValor = useRef<HTMLInputElement>(null);

  const preco = centavos / 100;
  const acimaDoTeto = preco > TETO;
  const perfil = perfis.find((p) => p.id === perfilId) ?? perfis[0];
  const icmsAliq = Math.min(100, Math.max(0, parseFloat(icmsTxt.replace(',', '.')) || 0));

  const r = useMemo(() => {
    const taxa = perfil.ipi / 100;
    const ipi = Math.round(((preco * taxa) / (1 + taxa)) * 100) / 100;
    const icms = Math.round(preco * (icmsAliq / 100) * 100) / 100;
    const total = ipi + icms;
    const pct = (v: number) => (preco > 0 ? (v / preco) * 100 : 0);
    return {
      ipi,
      icms,
      total,
      semIsencao: preco,
      comIsencao: preco - total,
      pctTotal: pct(total),
      pctIpi: pct(ipi),
      pctIcms: pct(icms),
      pctPaga: preco > 0 ? 100 - pct(total) : 100,
    };
  }, [preco, perfil.ipi, icmsAliq]);

  function alterarValor(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCentavos(Number(digitos));
  }

  function alterarIcms(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (!/^\d{0,3}(,\d{0,2})?$/.test(v)) return;
    setIcmsTxt(parseFloat(v.replace(',', '.')) > 100 ? '100' : v);
  }

  function ajustarValor() {
    campoValor.current?.focus();
    campoValor.current?.select();
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

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-16">
        <p className="mb-3 flex items-center gap-3 text-xs font-semibold tracking-[0.25em] text-[#1a9e94] uppercase">
          <span className="h-px w-8 bg-[#1a9e94]" /> Ferramenta gratuita
        </p>
        <h1 className="text-4xl font-semibold md:text-5xl">
          Calculadora de <span className="text-[#1a9e94]">economia</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#2f4f7f]">
          Informe o valor do veículo e o perfil de motorização para descobrir quanto a isenção de
          IPI e de ICMS representa em valores reais.
        </p>

        <div className="mt-10 grid items-stretch gap-8 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-8 shadow-[0_10px_30px_-12px_rgba(27,54,93,0.15)] md:p-10">
            <label htmlFor="valor" className={LABEL}>
              Valor do veículo
            </label>
            <div
              className={`${CAMPO} mt-3 ${
                acimaDoTeto
                  ? '!border-red-500 !bg-[#fff5f5] focus-within:!ring-red-500/15'
                  : 'border-[#d5e8e3]'
              }`}
            >
              <span className="text-lg font-semibold text-[#1a9e94]">R$</span>
              <input
                id="valor"
                ref={campoValor}
                inputMode="numeric"
                value={numero(preco)}
                onChange={alterarValor}
                aria-invalid={acimaDoTeto}
                className="w-full bg-transparent text-3xl font-medium outline-none"
              />
            </div>
            <p className={`mt-2 text-xs ${acimaDoTeto ? 'font-medium text-red-500' : 'text-[#6b7f99]'}`}>
              {acimaDoTeto
                ? 'Acima do teto de R$ 200 mil. Veículos com valor maior não têm direito à isenção de IPI.'
                : 'Valor de tabela, sem o desconto da isenção. O teto para a isenção de IPI é de R$ 200 mil.'}
            </p>

            <p className={`${LABEL} mt-8`}>Perfil de motorização</p>
            <div className="mt-3">
              <SeletorPerfil valor={perfilId} onChange={setPerfilId} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#6b7f99]">
              A alíquota de IPI varia conforme a tecnologia do motor.{' '}
              <strong className="text-[#1b365d]">Alíquota aplicada: {numero(perfil.ipi)}%</strong>. Na
              dúvida, consulte a ficha técnica do modelo.
            </p>

            <label htmlFor="icms" className={`${LABEL} mt-8 block`}>
              Alíquota de ICMS do seu estado
            </label>
            <div className={`${CAMPO} mt-3 border-[#d5e8e3]`}>
              <input
                id="icms"
                inputMode="decimal"
                value={icmsTxt}
                onChange={alterarIcms}
                onBlur={() => setIcmsTxt(numero(icmsAliq))}
                className="w-full bg-transparent text-2xl font-medium outline-none"
              />
              <span className="text-lg font-semibold text-[#1a9e94]">%</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#6b7f99]">
              Cada estado define sua alíquota de ICMS para PcD. Padrão: 12% (média nacional). Use 0%
              se o seu estado não concede a isenção.
            </p>
          </section>

          {acimaDoTeto ? (
            <section className="flex flex-col items-center justify-center rounded-3xl border border-[#f3dfb4] bg-[#fff8ea] p-8 text-center">
              <span className="grid h-24 w-24 place-items-center rounded-full bg-[#fdebc4]">
                <Icon name="warning_amber" className="!text-5xl text-[#c98a12]" />
              </span>
              <h2 className="mt-6 text-2xl font-semibold">Valor acima do teto da isenção</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#2f4f7f]">
                A isenção de IPI vale para veículos de até R$ 200 mil, com impostos incluídos. Ajuste o
                valor para ver a sua economia estimada.
              </p>
              <button
                onClick={ajustarValor}
                className="mt-5 rounded-xl border border-[#1a9e94] bg-white px-6 py-2.5 text-sm font-semibold text-[#1a9e94] hover:bg-[#e6f4f1]"
              >
                Ajustar o valor
              </button>
            </section>
          ) : (
            <section className="flex flex-col rounded-3xl border border-[#bfe3dc] bg-[#e4f4f0] p-8">
              <p className="text-center text-xs font-semibold tracking-[0.2em] text-[#1a9e94] uppercase">
                Sua economia total estimada
              </p>
              <p className="mt-3 flex items-start justify-center gap-2 leading-none">
                <span className="mt-2 text-2xl font-semibold text-[#1a9e94]">R$</span>
                <span className="text-6xl font-semibold tracking-tight md:text-7xl">
                  {numero(r.total)}
                </span>
              </p>
              <p className="mx-auto mt-5 max-w-md text-center text-sm leading-relaxed text-[#2f4f7f]">
                Somando <strong>{numero(perfil.ipi)}%</strong> de IPI e <strong>{numero(icmsAliq)}%</strong>{' '}
                de ICMS, a isenção representa <strong>{numero(r.pctTotal, 1)}%</strong> de economia sobre o
                preço de tabela.
              </p>

              <div className="mt-6 flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
                <span className="bg-[#c9d3dc] transition-all duration-500" style={{ width: `${r.pctPaga}%` }} />
                <span className="bg-[#1a9e94] transition-all duration-500" style={{ width: `${r.pctIpi}%` }} />
                <span className="bg-[#2f63b5] transition-all duration-500" style={{ width: `${r.pctIcms}%` }} />
              </div>
              <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-[#2f4f7f]">
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#c9d3dc]" /> Você paga
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#1a9e94]" /> Economia IPI
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#2f63b5]" /> Economia ICMS
                </li>
              </ul>

              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[#c5e3dc] pt-6">
                <div>
                  <dt className="text-[10px] font-semibold tracking-[0.2em] text-[#4a5f7a] uppercase">
                    Economia IPI
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-[#1a9e94]">{moeda(r.ipi)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold tracking-[0.2em] text-[#4a5f7a] uppercase">
                    Economia ICMS
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-[#2f63b5]">{moeda(r.icms)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold tracking-[0.2em] text-[#4a5f7a] uppercase">
                    Valor sem isenções
                  </dt>
                  <dd className="mt-1 text-xl font-semibold">{moeda(r.semIsencao)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold tracking-[0.2em] text-[#4a5f7a] uppercase">
                    Valor com isenções
                  </dt>
                  <dd className="mt-1 text-xl font-semibold">{moeda(r.comIsencao)}</dd>
                </div>
              </dl>

              <button
                onClick={abrirQuiz}
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a9e94] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#158a81]"
              >
                Descobrir se tenho direito (quiz de 3 min)
                <Icon name="arrow_forward" className="!text-xl" />
              </button>
            </section>
          )}
        </div>

        <aside className="mt-6 flex items-start gap-3 rounded-2xl border border-[#e3efec] bg-white px-6 py-4 text-xs leading-relaxed text-[#6b7f99]">
          <Icon name="info_outline" className="mt-0.5 !text-xl text-[#9fb3c8]" />
          <p>
            <strong className="text-[#1b365d]">Aviso.</strong> Estimativa baseada nas alíquotas do IPI
            vigentes para cada tecnologia de motor, somada à alíquota de ICMS que você informar. O ICMS é
            definido por cada estado; confira a alíquota oficial na Secretaria da Fazenda. Carros da
            categoria Carro Sustentável já têm IPI zero, então a isenção de IPI não gera economia extra
            nesse caso. Para valores exatos, consulte a concessionária ou a tabela da montadora.
          </p>
        </aside>
      </main>
    </div>
  );
}