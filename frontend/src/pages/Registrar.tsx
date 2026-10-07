import { useState } from 'react';
import type { FormEvent } from 'react';
import { isAxiosError } from 'axios';

import './Registrar.css';
import { registrarUsuario } from '../services/api';

interface RegistrarProps {
  fechar: () => void;
  abrirLogin: () => void;
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

    return dados.message ?? 'Não foi possível realizar o cadastro.';
  }

  return 'Não foi possível realizar o cadastro.';
}

export default function Registrar({
  fechar,
  abrirLogin
}: RegistrarProps) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
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
        fullName: nome.trim(),
        cpf: cpf.replace(/\D/g, ''),
        email: email.trim(),
        // Telefone é opcional: vazio não é enviado
        phone: telefone.trim() || undefined,
        password: senha
      });

      setSucesso('Cadastro realizado com sucesso.');

      setNome('');
      setCpf('');
      setTelefone('');
      setEmail('');
      setSenha('');
      setConfirmarSenha('');
    } catch (error) {
      setErro(extrairMensagemDeErro(error));
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
              required
            />
          </div>

          <div className="registrar-campo">
            <label>CPF</label>

            <input
              type="text"
              inputMode="numeric"
              value={cpf}
              onChange={(event) =>
                setCpf(event.target.value)
              }
              placeholder="000.000.000-00"
              maxLength={14}
              disabled={carregando}
              required
            />
          </div>

          <div className="registrar-campo">
            <label>Telefone (opcional)</label>

            <input
              type="tel"
              value={telefone}
              onChange={(event) =>
                setTelefone(event.target.value)
              }
              placeholder="(00) 00000-0000"
              maxLength={20}
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
              required
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
              minLength={8}
              disabled={carregando}
              required
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
              required
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