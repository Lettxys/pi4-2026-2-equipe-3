import { useState } from 'react';
import type { FormEvent } from 'react';
import { isAxiosError } from 'axios';

import './Login.css';
import { fazerLogin } from '../services/api';

interface LoginProps {
  fechar: () => void;
  abrirRegistrar: () => void;
}

// Monta a mensagem de erro a partir da resposta do backend:
// { status, code, message, details: [...] }
function extrairMensagemDeErro(error: unknown): string {
  if (isAxiosError(error)) {
    const dados = error.response?.data as
      | { message?: string; details?: unknown[] }
      | undefined;

    if (!dados) {
      return 'Não foi possível conectar ao servidor.';
    }

    // Cada item de "details" pode ser um texto ou um objeto com "message"
    const detalhes = (dados.details ?? [])
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object' && 'message' in item) {
          return String((item as { message: unknown }).message);
        }

        return '';
      })
      .filter(Boolean);

    if (detalhes.length > 0) {
      return detalhes.join(' ');
    }

    return dados.message ?? 'Não foi possível realizar o login.';
  }

  return 'Não foi possível realizar o login.';
}

export default function Login({
  fechar,
  abrirRegistrar
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro('');
    setCarregando(true);

    try {
      // O token já é salvo dentro de fazerLogin (api.ts)
      await fazerLogin({
        email: email.trim(),
        password: senha
      });

      fechar();
    } catch (error) {
      setErro(extrairMensagemDeErro(error));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-modal">

        <button
          className="login-fechar"
          onClick={fechar}
          type="button"
        >
          ×
        </button>

        <h2>Acesse sua conta</h2>

        <div className="login-linha"></div>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >

          <div className="login-campo">
            <label>E-mail</label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="seu@email.com"
              disabled={carregando}
              required
            />
          </div>

          <div className="login-campo">
            <label>Senha</label>

            <input
              type="password"
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
              placeholder="••••••"
              disabled={carregando}
              required
            />
          </div>

          {erro && (
            <div className="login-erro">
              {erro}
            </div>
          )}

          <div className="login-opcoes">

            <label>
              <input
                type="checkbox"
                disabled={carregando}
              />

              Lembrar de mim
            </label>

            <button
              type="button"
              disabled={carregando}
            >
              Esqueceu a senha?
            </button>

          </div>

          <button
            type="submit"
            className="login-botao"
            disabled={carregando}
          >
            {carregando
              ? 'Entrando...'
              : 'Entrar'}
          </button>

        </form>

        <div className="login-divisor">
          <span></span>

          <p>ou</p>

          <span></span>
        </div>

        <button
          type="button"
          className="login-cadastro"
          onClick={abrirRegistrar}
          disabled={carregando}
        >
          Criar uma conta
        </button>

      </div>
    </div>
  );
}