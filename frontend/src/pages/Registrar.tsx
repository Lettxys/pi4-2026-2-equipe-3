import { useState } from 'react';
import type { FormEvent } from 'react';
import { isAxiosError } from 'axios';

import './Registrar.css';
import { registrarUsuario } from '../services/api';
import MensagemEstado from '../components/estados/MensagemEstado';

interface RegistrarProps {
  fechar: () => void;
  abrirLogin: () => void;
}

function validarCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const verificaDigito = (baseLength: number): boolean => {
    let sum = 0;

    for (let i = 0; i < baseLength; i += 1) {
      sum += Number(digits[i]) * (baseLength + 1 - i);
    }

    const remainder = sum % 11;
    const expected = remainder < 2 ? 0 : 11 - remainder;

    return Number(digits[baseLength]) === expected;
  };

  return verificaDigito(9) && verificaDigito(10);
}

function formatarCpf(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) return digits;

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}


function formatarTelefone(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11);

  if (!digits) return '';

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const area = digits.slice(0, 2);
  const numero = digits.slice(2);

  if (numero.length <= 4) {
    return `(${area}) ${numero}`;
  }

  if (digits.length <= 10) {
    return `(${area}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
  }

  return `(${area}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
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
        if (typeof item === 'string') return item;

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
  abrirLogin,
}: RegistrarProps) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function handleRegistrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro('');
    setSucesso('');

    if (!nome.trim()) {
      setErro('Preencha o nome completo.');
      return;
    }

    if (!cpf.trim()) {
      setErro('Preencha o CPF.');
      return;
    }

    if (!email.trim()) {
      setErro('Preencha o e-mail.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro('E-mail inválido.');
      return;
    }

    if (!senha) {
      setErro('Preencha a senha.');
      return;
    }

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (!confirmarSenha) {
      setErro('Confirme a senha.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    if (!/[A-Z]/.test(senha)) {
      setErro('A senha deve conter pelo menos uma letra maiúscula.');
      return;
    }

    if (!/[^A-Za-z0-9\s]/.test(senha)) {
      setErro('A senha deve conter pelo menos um caractere especial.');
      return;
    }

    if (!validarCpf(cpf)) {
      setErro('CPF inválido.');
      return;
    }

    setCarregando(true);

    try {
      await registrarUsuario({
        fullName: nome.trim(),
        cpf: cpf.replace(/\D/g, ''),
        email: email.trim(),
        phone: telefone.trim() || undefined,
        password: senha,
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
      <div
        className="registrar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registrar-titulo"
      >
        <button
          className="registrar-fechar"
          onClick={fechar}
          type="button"
          aria-label="Fechar cadastro"
          disabled={carregando}
        >
          ×
        </button>

        <h2 id="registrar-titulo">Crie sua conta</h2>

        <div className="registrar-linha" />

        <form
          className="registrar-form"
          onSubmit={handleRegistrar}
          noValidate
        >
          <div className="registrar-campo">
            <label htmlFor="registrar-nome">Nome completo</label>
            <input
              id="registrar-nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Como no documento"
              autoComplete="name"
              disabled={carregando}
              required
            />
          </div>

          <div className="registrar-campos-linha">
            <div className="registrar-campo">
              <label htmlFor="registrar-cpf">CPF</label>
              <input
                id="registrar-cpf"
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(event) =>
                  setCpf(formatarCpf(event.target.value))
                }
                placeholder="000.000.000-00"
                maxLength={14}
                autoComplete="off"
                disabled={carregando}
                required
              />
            </div>

            <div className="registrar-campo">
              <label htmlFor="registrar-telefone">
                Telefone (opcional)
              </label>
              <input
                id="registrar-telefone"
                type="tel"
                value={telefone}
                onChange={(event) =>
                  setTelefone(formatarTelefone(event.target.value))
                }
                placeholder="(00) 00000-0000"
                maxLength={15}
                autoComplete="tel"
                disabled={carregando}
              />
            </div>
          </div>

          <div className="registrar-campo">
            <label htmlFor="registrar-email">E-mail</label>
            <input
              id="registrar-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              disabled={carregando}
              required
            />
          </div>

          <div className="registrar-campo">
            <label htmlFor="registrar-senha">Senha</label>
            <div className="registrar-senha-wrapper">
              <input
                id="registrar-senha"
                type={mostrarSenha ? 'text' : 'password'}
                className="registrar-senha-input"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="mi­nimo de 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                disabled={carregando}
                required
              />
              <button
                type="button"
                className="registrar-senha-toggle"
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

          <div className="registrar-campo">
            <label htmlFor="registrar-confirmar-senha">
              Confirmar senha
            </label>
            <div className="registrar-senha-wrapper">
              <input
                id="registrar-confirmar-senha"
                type={mostrarConfirmarSenha ? 'text' : 'password'}
                className="registrar-senha-input"
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
                disabled={carregando}
                required
              />
              <button
                type="button"
                className="registrar-senha-toggle"
                onClick={() =>
                  setMostrarConfirmarSenha((valor) => !valor)
                }
                disabled={carregando}
                aria-label={
                  mostrarConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'
                }
              >
                {mostrarConfirmarSenha ? (
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
          <MensagemEstado tipo="sucesso" mensagem={sucesso} />

          <button
            type="submit"
            className="registrar-botao"
            disabled={carregando}
          >
            {carregando ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <div className="registrar-login">
          <span>Já tem conta?</span>

          <button
            type="button"
            onClick={abrirLogin}
            disabled={carregando}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
