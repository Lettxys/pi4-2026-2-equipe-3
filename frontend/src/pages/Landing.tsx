import Menu from '../components/Menu';
import './Landing.css';

interface LandingProps {
  abrirLogin: () => void;
  abrirRegistrar: () => void;
}

export default function Landing({
  abrirLogin,
  abrirRegistrar
}: LandingProps) {
  return (
    <div className="landing">

      <Menu
        abrirLogin={abrirLogin}
        abrirRegistrar={abrirRegistrar}
      />

      <main className="landing-conteudo">

        <section className="landing-apresentacao">

          <h1>
            Bem-vindo ao nosso sistema
          </h1>

          <p>
            Crie sua conta ou entre para começar
            a utilizar a plataforma.
          </p>

          <button
            className="landing-botao"
            onClick={abrirRegistrar}
          >
            Começar agora
          </button>

        </section>

      </main>

    </div>
  );
}