import { useEffect, useRef, useState } from 'react';
import type {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
} from 'react';

import './ForgotPassword.css';
import MensagemEstado from '../components/estados/MensagemEstado';
import { esqueciSenha, extrairMensagemDeErro, verificarCodigo } from '../services/api';

interface VerificarCodigoProps {
  email: string;
  onVoltar: () => void;
  onFechar: () => void;
  onVerificado: (resetToken: string) => void;
}

const TAMANHO_CODIGO = 6;
const SEGUNDOS_REENVIO = 45;

function mascararEmail(email: string): string {
  const [usuario, dominio] = email.split('@');

  if (!usuario || !dominio) {
    return email;
  }

  return `${usuario.charAt(0)}•••••@${dominio}`;
}

function formatarTempo(segundos: number): string {
  return `0:${String(segundos).padStart(2, '0')}`;
}

export default function VerificarCodigo({
  email,
  onVoltar,
  onFechar,
  onVerificado,
}: VerificarCodigoProps) {
  const [digitos, setDigitos] = useState<string[]>(
    Array(TAMANHO_CODIGO).fill('')
  );
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [segundos, setSegundos] = useState(SEGUNDOS_REENVIO);

  const caixas = useRef<(HTMLInputElement | null)[]>([]);

  // Foco na primeira caixa ao abrir
  useEffect(() => {
    caixas.current[0]?.focus();
  }, []);

  // Contagem regressiva para liberar o reenvio
  useEffect(() => {
    if (segundos <= 0) {
      return;
    }

    const temporizador = setTimeout(() => {
      setSegundos((valor) => valor - 1);
    }, 1000);

    return () => clearTimeout(temporizador);
  }, [segundos]);

  function preencherCaixas(inicio: number, texto: string) {
    const caracteres = texto
      .replace(/\s/g, '')
      .slice(0, TAMANHO_CODIGO - inicio)
      .split('');

    if (caracteres.length === 0) {
      return;
    }

    setDigitos((atual) => {
      const novo = [...atual];

      caracteres.forEach((caractere, i) => {
        novo[inicio + i] = caractere;
      });

      return novo;
    });

    const proxima = Math.min(inicio + caracteres.length, TAMANHO_CODIGO - 1);
    caixas.current[proxima]?.focus();
  }

  function aoDigitar(indice: number, event: ChangeEvent<HTMLInputElement>) {
    const valor = event.target.value;

    if (valor === '') {
      setDigitos((atual) => {
        const novo = [...atual];
        novo[indice] = '';
        return novo;
      });
      return;
    }

    // Caixa já preenchida: usa só o caractere que a pessoa acabou de digitar
    const digitado = (event.nativeEvent as InputEvent).data;
    const texto =
      digitos[indice] && valor.length === 2 && digitado && digitado.length === 1
        ? digitado
        : valor;

    preencherCaixas(indice, texto);
  }

  function aoPressionarTecla(
    indice: number,
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === 'Backspace' && digitos[indice] === '' && indice > 0) {
      event.preventDefault();

      setDigitos((atual) => {
        const novo = [...atual];
        novo[indice - 1] = '';
        return novo;
      });

      caixas.current[indice - 1]?.focus();
    }

    if (event.key === 'ArrowLeft' && indice > 0) {
      event.preventDefault();
      caixas.current[indice - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && indice < TAMANHO_CODIGO - 1) {
      event.preventDefault();
      caixas.current[indice + 1]?.focus();
    }
  }

  function aoColar(indice: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const texto = event.clipboardData.getData('text').replace(/\s/g, '');
    preencherCaixas(texto.length >= TAMANHO_CODIGO ? 0 : indice, texto);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setSucesso('');

    const codigo = digitos.join('').trim();

    if (!codigo) {
      setErro('Informe o código recebido por e-mail.');
      return;
    }

    if (codigo.length !== TAMANHO_CODIGO) {
      setErro('O código deve ter 6 caracteres.');
      return;
    }

    setCarregando(true);

    try {
      const resposta = await verificarCodigo({
        email,
        code: codigo,
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
    if (segundos > 0 || carregando) {
      return;
    }

    setErro('');
    setSucesso('');
    setCarregando(true);

    try {
      const resposta = await esqueciSenha(email);
      setSucesso(resposta.message);
      setDigitos(Array(TAMANHO_CODIGO).fill(''));
      setSegundos(SEGUNDOS_REENVIO);
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
          className="forgot-voltar"
          onClick={onVoltar}
          disabled={carregando}
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M14 8H2M7 3 2 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Usar outro e-mail
        </button>

        <button
          type="button"
          className="forgot-fechar"
          onClick={onFechar}
          aria-label="Fechar verificação de código"
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

        <div className="forgot-icone" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="m3.5 7 8.5 6 8.5-6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 id="codigo-titulo">Digite o código</h2>

        <p className="forgot-descricao">
          Enviamos um código de 6 dígitos para{' '}
          <strong>{mascararEmail(email)}</strong>. Confira também a caixa
          de spam.
        </p>

        <form
          className="forgot-form forgot-form-codigo"
          onSubmit={handleSubmit}
          noValidate
        >
          <div
            className="forgot-codigo-caixas"
            role="group"
            aria-label="Código de verificação"
          >
            {digitos.map((digito, indice) => (
              <input
                key={indice}
                ref={(elemento) => {
                  caixas.current[indice] = elemento;
                }}
                className="forgot-codigo-caixa"
                type="text"
                inputMode="text"
                autoComplete={indice === 0 ? 'one-time-code' : 'off'}
                aria-label={`Caractere ${indice + 1} do código`}
                value={digito}
                onChange={(event) => aoDigitar(indice, event)}
                onKeyDown={(event) => aoPressionarTecla(indice, event)}
                onPaste={(event) => aoColar(indice, event)}
                onFocus={(event) => event.target.select()}
                disabled={carregando}
              />
            ))}
          </div>

          <div className="forgot-codigo-info">
            <span>O código expira em 10 minutos.</span>

            {segundos > 0 ? (
              <span>Reenviar código em {formatarTempo(segundos)}</span>
            ) : (
              <button
                type="button"
                className="forgot-reenviar"
                onClick={reenviar}
                disabled={carregando}
              >
                Reenviar código
              </button>
            )}
          </div>

          {(erro || sucesso) && (
            <div className="forgot-mensagens">
              <MensagemEstado tipo="erro" mensagem={erro} />
              <MensagemEstado tipo="sucesso" mensagem={sucesso} />
            </div>
          )}

          <button
            type="submit"
            className="forgot-botao"
            disabled={carregando}
          >
            {carregando ? 'Verificando...' : 'Confirmar código'}
          </button>
        </form>
      </section>
    </div>
  );
}