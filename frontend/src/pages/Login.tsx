import { useState } from 'react';
import type { FormEvent } from 'react';
import { isAxiosError } from 'axios';

import './Login.css';
import { fazerLogin } from '../services/api';
import MensagemEstado from '../components/estados/MensagemEstado';

interface LoginProps {
  fechar: () => void;
  abrirRegistrar: () => void;
  abrirForgotPassword: () => void;
  // Chamado quando o login é aceito pelo servidor (ex.: ir para o Overview)
  aoEntrar?: () => void;
}

function extrairMensagemDeErro(error: unknown): string {
  if (isAxiosError(error)) {
    const dados = error.response?.data as
      | { message?: string; details?: unknown[] }
      | undefined;

    if (!dados) {
      return 'Não foi possível conectar ao servidor.';
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

    return dados.message ?? 'Não foi possível realizar o login.';
  }

  return 'Não foi possível realizar o login.';
}

export default function Login({
  fechar,
  abrirRegistrar,
  abrirForgotPassword,
  aoEntrar,
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro('');

    if (!email.trim()) {
      setErro('Preencha o e-mail.');
      return;
    }

    if (!senha.trim()) {
      setErro('Preencha a senha.');
      return;
    }

    setCarregando(true);

    try {
      await fazerLogin(
        {
          email: email.trim(),
          password: senha,
        },
        lembrar
      );

      if (aoEntrar) {
        aoEntrar();
      } else {
        fechar();
      }
    } catch (error) {
      setErro(extrairMensagemDeErro(error));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-overlay" onClick={fechar}>
      <section
        className="login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="login-fechar"
          onClick={fechar}
          type="button"
          aria-label="Fechar login"
          disabled={carregando}
        >
          ×
        </button>

        <h2 id="login-titulo">Acesse sua conta</h2>
        <div className="login-linha" />

        <form
          className="login-form"
          onSubmit={handleLogin}
          noValidate
        >
          <div className="login-campo">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              disabled={carregando}
              required
            />
          </div>

          <div className="login-campo">
            <label htmlFor="login-senha">Senha</label>
            <div className="login-senha-wrapper">
              <input
                id="login-senha"
                type={mostrarSenha ? 'text' : 'password'}
                className="login-senha-input"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                disabled={carregando}
                required
              />
              <button
                type="button"
                className="login-senha-toggle"
                onClick={() => setMostrarSenha((valor) => !valor)}
                disabled={carregando}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <MensagemEstado tipo="erro" mensagem={erro} />

          <div className="login-opcoes">
            <label className="login-lembrar">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(event) => setLembrar(event.target.checked)}
                disabled={carregando}
              />
              Lembrar de mim
            </label>

            <button
              type="button"
              className="login-link"
              disabled={carregando}
              onClick={abrirForgotPassword}
            >
              Esqueceu a senha?
            </button>
          </div>

          <button
            type="submit"
            className="login-botao"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-divisor">
          <span />
          <p>ou</p>
          <span />
        </div>

        <button
          type="button"
          className="login-cadastro"
          onClick={abrirRegistrar}
          disabled={carregando}
        >
          Criar uma conta
        </button>
      </section>
    </div>
  );
}