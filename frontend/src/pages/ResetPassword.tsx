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

export default function ResetPassword({
  token,
  fechar,
  voltarLogin,
}: ResetPasswordProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const formularioVazio = !novaSenha && !confirmarSenha;

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
          ×
        </button>

        <h2 id="reset-titulo">Alterar senha</h2>

        <p className="reset-descricao">
          Crie uma nova senha segura para acessar sua conta.
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

            <input
              id="reset-nova-senha"
              type="password"
              placeholder="Digite sua nova senha"
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
          </div>

          <div className="reset-campo">
            <label htmlFor="reset-confirmar-senha">
              Confirmar nova senha
            </label>

            <input
              id="reset-confirmar-senha"
              type="password"
              placeholder="Confirme sua nova senha"
              value={confirmarSenha}
              onChange={(event) => {
                setConfirmarSenha(event.target.value);
                setErro('');
                setSucesso('');
              }}
              autoComplete="new-password"
              disabled={carregando || Boolean(sucesso)}
            />
          </div>

          {carregando ? (
            <MensagemEstado
              tipo="carregando"
              mensagem="Alterando sua senha..."
            />
          ) : formularioVazio && !erro && !sucesso ? (
            <MensagemEstado
              tipo="vazio"
              mensagem="Preencha os campos para cadastrar uma nova senha."
            />
          ) : null}

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
              {carregando ? 'Alterando...' : 'Trocar senha'}
            </button>
          )}
        </form>

        {!sucesso && (
          <button
            type="button"
            className="reset-voltar"
            onClick={voltarLogin}
            disabled={carregando}
          >
            Voltar para o login
          </button>
        )}
      </section>
    </div>
  );
}