import { useState } from 'react';
import type { FormEvent } from 'react';

import './ForgotPassword.css';
import MensagemEstado from '../components/estados/MensagemEstado';
import { esqueciSenha, extrairMensagemDeErro, verificarCodigo } from '../services/api';

interface VerificarCodigoProps {
  email: string;
  onVoltar: () => void;
  onFechar: () => void;
  onVerificado: (resetToken: string) => void;
}

export default function VerificarCodigo({
  email,
  onVoltar,
  onFechar,
  onVerificado,
}: VerificarCodigoProps) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setSucesso('');

    if (!codigo.trim()) {
      setErro('Informe o código recebido por e-mail.');
      return;
    }

    if (codigo.trim().length !== 6) {
      setErro('O código deve ter 6 caracteres.');
      return;
    }

    setCarregando(true);

    try {
      const resposta = await verificarCodigo({
        email,
        code: codigo.trim(),
      });

      onVerificado(resposta.resetToken);
    } catch (error) {
      setErro(
        extrairMensagemDeErro(
          error,
          'Não foi possível verificar o código. Tente novamente.'
        )
      );
    } finally {
      setCarregando(false);
    }
  }

  async function reenviar() {
    setErro('');
    setSucesso('');
    setCarregando(true);

    try {
      const resposta = await esqueciSenha(email);
      setSucesso(resposta.message);
    } catch (error) {
      setErro(
        extrairMensagemDeErro(
          error,
          'Não foi possível reenviar o código. Tente novamente.'
        )
      );
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
        aria-labelledby="codigo-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="forgot-fechar"
          onClick={onFechar}
          aria-label="Fechar verificação de código"
        >
          ×
        </button>

        <div className="forgot-icone" aria-hidden="true" />

        <h2 id="codigo-titulo">Digite o código</h2>

        <p className="forgot-descricao">
          Enviamos um código de 6 caracteres para {email}.
        </p>

        <form className="forgot-form" onSubmit={handleSubmit} noValidate>
          <div className="forgot-campo">
            <label htmlFor="codigo-input">Código</label>

            <input
              id="codigo-input"
              type="text"
              placeholder="000000"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              disabled={carregando}
            />
          </div>

          <MensagemEstado tipo="erro" mensagem={erro} />
          <MensagemEstado tipo="sucesso" mensagem={sucesso} />

          <button
            type="submit"
            className="forgot-botao"
            disabled={carregando}
          >
            {carregando ? 'Verificando...' : 'Verificar código'}
          </button>
        </form>

        <button
          type="button"
          className="forgot-voltar"
          onClick={reenviar}
          disabled={carregando}
        >
          Reenviar código
        </button>

        <button
          type="button"
          className="forgot-voltar"
          onClick={onVoltar}
          disabled={carregando}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',width: '100%' }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }} aria-hidden="true">
            arrow_back
          </span>
          Alterar e-mail
        </button>
      </section>
    </div>
  );
}