import { useState } from 'react';
import type { FormEvent } from 'react';

import './Registrar.css';
import { registrarUsuario } from '../services/api';

interface RegistrarProps {
  fechar: () => void;
  abrirLogin: () => void;
}

export default function Registrar({
  fechar,
  abrirLogin
}: RegistrarProps) {
  const [nome, setNome] = useState('');
  const [cpfTelefone, setCpfTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function handleRegistrar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro('');
    setSucesso('');

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);

    try {
      await registrarUsuario({
        nome,
        cpfTelefone,
        email,
        senha
      });

      setSucesso('Cadastro realizado com sucesso.');

      setNome('');
      setCpfTelefone('');
      setEmail('');
      setSenha('');
      setConfirmarSenha('');
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro('Não foi possível realizar o cadastro.');
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="registrar-overlay">
      <div className="registrar-modal">
        <button
          className="registrar-fechar"
          onClick={fechar}
          type="button"
        >
          ×
        </button>

        <h2>Crie sua conta</h2>

        <div className="registrar-linha"></div>

        <form
          className="registrar-form"
          onSubmit={handleRegistrar}
        >
          <div className="registrar-campo">
            <label>Nome completo</label>

            <input
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
              placeholder="Como no documento"
              disabled={carregando}
            />
          </div>

          <div className="registrar-campo">
            <label>CPF | Telefone</label>

            <input
              type="text"
              value={cpfTelefone}
              onChange={(event) =>
                setCpfTelefone(event.target.value)
              }
              placeholder="000.000.000-00"
              disabled={carregando}
            />
          </div>

          <div className="registrar-campo">
            <label>E-mail</label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="seu@email.com"
              disabled={carregando}
            />
          </div>

          <div className="registrar-campo">
            <label>Senha</label>

            <input
              type="password"
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
              placeholder="Mín. 8, números e maiúscula"
              disabled={carregando}
            />
          </div>

          <div className="registrar-campo">
            <label>Confirmar senha</label>

            <input
              type="password"
              value={confirmarSenha}
              onChange={(event) =>
                setConfirmarSenha(event.target.value)
              }
              placeholder="Repita a senha"
              disabled={carregando}
            />
          </div>

          {erro && (
            <div className="registrar-erro">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="registrar-sucesso">
              {sucesso}
            </div>
          )}

          <button
            type="submit"
            className="registrar-botao"
            disabled={carregando}
          >
            {carregando
              ? 'Cadastrando...'
              : 'Cadastrar'}
          </button>
        </form>

        <div className="registrar-login">
          <span>Já tem conta?</span>

          <button
            type="button"
            onClick={abrirLogin}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}