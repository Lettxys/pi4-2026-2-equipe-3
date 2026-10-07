import { useState } from 'react';
import type { FormEvent } from 'react';

import './Login.css';
import { fazerLogin } from '../services/api';

interface LoginProps {
  fechar: () => void;
  abrirRegistrar: () => void;
}

export default function Login({
  fechar,
  abrirRegistrar
}: LoginProps) {
  const [emailCpf, setEmailCpf] = useState('');
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
      const dados = await fazerLogin({
        emailCpf,
        senha
      });

      console.log('Login realizado:', dados);

      fechar();
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro(
          'Não foi possível realizar o login.'
        );
      }
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
            <label>E-mail ou CPF</label>

            <input
              type="text"
              value={emailCpf}
              onChange={(event) =>
                setEmailCpf(event.target.value)
              }
              placeholder="seu@email.com"
              disabled={carregando}
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