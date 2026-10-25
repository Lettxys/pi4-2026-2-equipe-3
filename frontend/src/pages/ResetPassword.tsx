import { useState } from 'react';
import type { FormEvent } from 'react';

import './ResetPassword.css';
import { extrairMensagemDeErro, redefinirSenha } from '../services/api';
import MensagemEstado from '../components/estados/MensagemEstado';

interface ResetPasswordProps {
  token: string;
  fechar: () => void;
  voltarLogin: () => void;
}

function IconeOlho({ aberto }: { aberto: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {!aberto && (
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function IconeRegra({ ok }: { ok: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {ok && (
        <path
          d="m8 12.5 3 3 5-6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export default function ResetPassword({
  token,
  fechar,
  voltarLogin,
}: ResetPasswordProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarNova, setMostrarNova] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const regras = [
    { texto: 'Pelo menos 8 caracteres', ok: novaSenha.length >= 8 },
    { texto: 'Pelo menos um número', ok: /[0-9]/.test(novaSenha) },
    { texto: 'Pelo menos uma letra maiúscula', ok: /[A-Z]/.test(novaSenha) },
    {
      texto: 'As duas senhas são iguais',
      ok: novaSenha.length > 0 && novaSenha === confirmarSenha,
    },
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro('');
    setSucesso('');

    if (!token.trim()) {
      setErro('Token de redefinição inválido ou ausente. Solicite a recuperação novamente.');
      return;
    }

    if (!novaSenha) {
      setErro('A nova senha deve ser informada.');
      return;
    }

    if (novaSenha.length < 8) {
      setErro('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (novaSenha.length > 128) {
      setErro('A nova senha deve ter no máximo 128 caracteres.');
      return;
    }

    if (!/[a-z]/.test(novaSenha)) {
      setErro('A nova senha deve conter pelo menos uma letra minúscula.');
      return;
    }

    if (!/[A-Z]/.test(novaSenha)) {
      setErro('A nova senha deve conter pelo menos uma letra maiúscula.');
      return;
    }

    if (!/[0-9]/.test(novaSenha)) {
      setErro('A nova senha deve conter pelo menos um número.');
      return;
    }

    if (!/[^a-zA-Z0-9]/.test(novaSenha)) {
      setErro('A nova senha deve conter pelo menos um caractere especial.');
      return;
    }

    if (!confirmarSenha) {
      setErro('A confirmação da senha deve ser informada.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);

    try {
      const resposta = await redefinirSenha({
        token,
        newPassword: novaSenha,
      });

      setSucesso(
        resposta.message || 'Senha alterada com sucesso!'
      );

      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error: unknown) {
      setErro(
        extrairMensagemDeErro(
          error,
          'Erro ao alterar a senha. Tente novamente.'
        )
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      className="reset-overlay"
      onClick={() => {
        if (!carregando) fechar();
      }}
    >
      <section
        className="reset-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="reset-fechar"
          onClick={fechar}
          disabled={carregando}
          aria-label="Fechar"
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

        <div className="reset-icone" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle
              cx="7.5"
              cy="12"
              r="3.8"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M11.3 12H21M17.5 12v3M20.5 12v2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 id="reset-titulo">Crie uma nova senha</h2>

        <p className="reset-descricao">
          Escolha uma senha que você não usou antes.
        </p>

        <form
          className="reset-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="reset-campo">
            <label htmlFor="reset-nova-senha">
              Nova senha
            </label>

            <div className="reset-input-wrap">
              <input
                id="reset-nova-senha"
                type={mostrarNova ? 'text' : 'password'}
                placeholder="Mín. 8 caracteres, com números e letra maiúscula"
                value={novaSenha}
                onChange={(event) => {
                  setNovaSenha(event.target.value);
                  setErro('');
                  setSucesso('');
                }}
                autoComplete="new-password"
                disabled={carregando || Boolean(sucesso)}
                aria-invalid={Boolean(erro)}
              />

              <button
                type="button"
                className="reset-olho"
                onClick={() => setMostrarNova((valor) => !valor)}
                aria-label={mostrarNova ? 'Ocultar senha' : 'Mostrar senha'}
                disabled={carregando || Boolean(sucesso)}
              >
                <IconeOlho aberto={mostrarNova} />
              </button>
            </div>
          </div>

          <div className="reset-campo">
            <label htmlFor="reset-confirmar-senha">
              Confirmar nova senha
            </label>

            <div className="reset-input-wrap">
              <input
                id="reset-confirmar-senha"
                type={mostrarConfirmar ? 'text' : 'password'}
                placeholder="Repita a nova senha"
                value={confirmarSenha}
                onChange={(event) => {
                  setConfirmarSenha(event.target.value);
                  setErro('');
                  setSucesso('');
                }}
                autoComplete="new-password"
                disabled={carregando || Boolean(sucesso)}
              />

              <button
                type="button"
                className="reset-olho"
                onClick={() => setMostrarConfirmar((valor) => !valor)}
                aria-label={
                  mostrarConfirmar ? 'Ocultar confirmação' : 'Mostrar confirmação'
                }
                disabled={carregando || Boolean(sucesso)}
              >
                <IconeOlho aberto={mostrarConfirmar} />
              </button>
            </div>
          </div>

          <ul className="reset-regras" aria-label="Requisitos da senha">
            {regras.map((regra) => (
              <li
                key={regra.texto}
                className={regra.ok ? 'reset-regra ok' : 'reset-regra'}
              >
                <IconeRegra ok={regra.ok} />
                {regra.texto}
              </li>
            ))}
          </ul>

          <MensagemEstado tipo="erro" mensagem={erro} />
          <MensagemEstado tipo="sucesso" mensagem={sucesso} />

          {sucesso ? (
            <button
              type="button"
              className="reset-botao"
              onClick={voltarLogin}
            >
              Voltar para o login
            </button>
          ) : (
            <button
              type="submit"
              className="reset-botao"
              disabled={carregando}
            >
              {carregando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          )}
        </form>
      </section>
    </div>
  );
}