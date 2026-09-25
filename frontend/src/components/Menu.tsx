interface MenuProps {
  mudarTela: (tela: number) => void;
}

export default function Menu({ mudarTela }: MenuProps) {
  return (
    <nav className="w-full bg-slate-950 border-b border-slate-800 px-6 py-4">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-3">
        <button
          onClick={() => mudarTela(1)}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold px-5 py-2 rounded-lg transition-colors shadow-lg"
        >
          Tela 1
        </button>

        <button
          onClick={() => mudarTela(2)}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold px-5 py-2 rounded-lg transition-colors shadow-lg"
        >
          Tela 2
        </button>

        <button
          onClick={() => mudarTela(3)}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold px-5 py-2 rounded-lg transition-colors shadow-lg"
        >
          Tela 3
        </button>

        <button
          onClick={() => mudarTela(4)}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold px-5 py-2 rounded-lg transition-colors shadow-lg"
        >
          Tela 4
        </button>

        <button
          onClick={() => mudarTela(5)}
          className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold px-5 py-2 rounded-lg transition-colors shadow-lg"
        >
          Tela 5
        </button>
      </div>
    </nav>
  );
}