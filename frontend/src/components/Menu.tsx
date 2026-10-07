import './Menu.css';

interface MenuProps {
  abrirLogin: () => void;
  abrirRegistrar: () => void;
}

export default function Menu({
  abrirLogin,
  abrirRegistrar
}: MenuProps) {
  return (
    <header className="menu">
      <div className="menu-conteudo">

        <div className="menu-logo">
          Meu Sistema
        </div>

        <nav className="menu-navegacao">
          <button
            className="menu-entrar"
            onClick={abrirLogin}
          >
            Entrar
          </button>

          <button
            className="menu-comecar"
            onClick={abrirRegistrar}
          >
            Começar
          </button>
        </nav>

      </div>
    </header>
  );
}