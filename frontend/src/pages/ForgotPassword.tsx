import { useState } from 'react';
import type { FormEvent } from 'react';
import { isAxiosError } from 'axios';

import './ForgotPassword.css';
import MensagemEstado from '../components/estados/MensagemEstado';
import { esqueciSenha } from '../services/api';

function extrairMensagemDeErro(error: unknown): string {
  if (isAxiosError(error)) {
    const dados = error.response?.data as
      | { message?: string; details?: unknown[] }
      | undefined;

    if (!dados) {
      return 'Nao foi possivel conectar ao servidor.';
    }

    const detalhes = (dados.details ?? [])
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (
          item &&
          typeof item === 'object' &&
          'message' in item
        ) {
          return String(
            (item as { message: unknown }).message
          );
        }

        return '';
      })
      .filter(Boolean);

    if (detalhes.length > 0) {
      return detalhes.join(' ');
    }

    return (
      dados.message ??
      'Nao foi possivel solicitar a recuperacao. Tente novamente.'
    );
  }

  return 'Nao foi possivel solicitar a recuperacao. Tente novamente.';
}

interface ForgotPasswordProps {
  onVoltar: () => void;
  onFechar: () => void;
  // Chamado depois que o código é enviado com sucesso (o App.tsx já passa essa prop)
  onCodigoEnviado?: (email: string) => void;
}

export default function ForgotPassword({
  onVoltar,
  onFechar,
  onCodigoEnviado,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro('');
    setMensagem('');

    if (!email.trim()) {
      setErro('Informe seu e-mail.');
      return;
    }

    setCarregando(true);

    try {
      const emailLimpo = email.trim();
      const resposta = await esqueciSenha(emailLimpo);

      if (onCodigoEnviado) {
        onCodigoEnviado(emailLimpo);
      } else {
        setMensagem(resposta.message);
      }
    } catch (error) {
      setErro(extrairMensagemDeErro(error));
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
          className="forgot-voltar"
          onClick={onVoltar}
          disabled={carregando}
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M14 8H2M7 3 2 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Voltar ao login
        </button>

        <button
          type="button"
          className="forgot-fechar"
          onClick={onFechar}
          aria-label="Fechar recuperação de senha"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 3l10 10M13 3 3 13"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="forgot-icone" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect
              x="4.5"
              y="10.5"
              width="15"
              height="10"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M8 10.5V7.5a4 4 0 0 1 8 0v3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 14.5v2.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 id="forgot-titulo">Esqueceu sua senha?</h2>

        <p className="forgot-descricao">
          Informe o e-mail cadastrado. Vamos enviar um código de
          segurança de 6 dígitos para você criar uma nova senha.
        </p>

        <form className="forgot-form" onSubmit={handleSubmit}>
          <div className="forgot-campo">
            <label htmlFor="forgot-email">E-mail cadastrado</label>

            <input
              id="forgot-email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={carregando}
            />
          </div>

          <MensagemEstado tipo="erro" mensagem={erro} />
          <MensagemEstado tipo="sucesso" mensagem={mensagem} />

          <button
            type="submit"
            className="forgot-botao"
            disabled={carregando}
          >
            {carregando ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>
      </section>
    </div>
  );
}