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
}

export default function ForgotPassword({
  onVoltar,
  onFechar,
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
      const resposta = await esqueciSenha(email.trim());
      setMensagem(resposta.message);
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
          className="forgot-fechar"
          onClick={onFechar}
          aria-label="Fechar recuperação de senha"
        >
          ×
        </button>

        <div className="forgot-icone" aria-hidden="true" />

        <h2 id="forgot-titulo">Esqueceu sua senha?</h2>

        <p className="forgot-descricao">
          Informe o e-mail cadastrado na sua conta para solicitar
          a recuperação da senha.
        </p>

        <form className="forgot-form" onSubmit={handleSubmit}>
          <div className="forgot-campo">
            <label htmlFor="forgot-email">E-mail</label>

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
            {carregando ? 'Enviando...' : 'Recuperar senha'}
          </button>
        </form>

        <button
          type="button"
          className="forgot-voltar"
          onClick={onVoltar}
          disabled={carregando}
        >
          ← Voltar para o login
        </button>
      </section>
    </div>
  );
}
