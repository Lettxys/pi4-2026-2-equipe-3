import { useState } from 'react';
import type { FormEvent } from 'react';

import './ForgotPassword.css';
import MensagemEstado from '../components/estados/MensagemEstado';
import { esqueciSenha, extrairMensagemDeErro } from '../services/api';

interface ForgotPasswordProps {
  onVoltar: () => void;
  onFechar: () => void;
  onCodigoEnviado: (email: string) => void;
}

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword({
  onVoltar,
  onFechar,
  onCodigoEnviado,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');

    const emailLimpo = email.trim();

    if (!emailLimpo) {
      setErro('Informe seu e-mail.');
      return;
    }

    if (!REGEX_EMAIL.test(emailLimpo)) {
      setErro('E-mail inválido.');
      return;
    }

    setCarregando(true);

    try {
      await esqueciSenha(emailLimpo);
      onCodigoEnviado(emailLimpo);
    } catch (error) {
      setErro(
        extrairMensagemDeErro(
          error,
          'Não foi possível solicitar a recuperação. Tente novamente.'
        )
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="forgot-overlay" onClick={onFechar}>
      <section
        className="forgot-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="forgot-fechar"
          onClick={onFechar}
          aria-label="Fechar recuperação de senha"
        >
          ×
        </button>

        <div className="forgot-icone" aria-hidden="true" />

        <h2 id="forgot-titulo">Esqueceu sua senha?</h2>

        <p className="forgot-descricao">
          Informe o e-mail cadastrado na sua conta para receber o código de
          recuperação.
        </p>

        <form className="forgot-form" onSubmit={handleSubmit} noValidate>
          <div className="forgot-campo">
            <label htmlFor="forgot-email">E-mail</label>

            <input
              id="forgot-email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={carregando}
            />
          </div>

          <MensagemEstado tipo="erro" mensagem={erro} />

          <button
            type="submit"
            className="forgot-botao"
            disabled={carregando}
          >
            {carregando ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>

        <button
          type="button"
          className="forgot-voltar"
          onClick={onVoltar}
          disabled={carregando}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',width: '100%' }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }} aria-hidden="true">
            arrow_back
          </span>
          Voltar para o login
        </button>
      </section>
    </div>
  );
}