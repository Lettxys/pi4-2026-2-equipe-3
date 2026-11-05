import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import './EditarDados.css';
import MensagemEstado from '../components/estados/MensagemEstado';
import { extrairMensagemDeErro } from '../services/api';

export interface DadosUsuario {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}

interface EditarDadosProps {
  aberto: boolean;
  dadosIniciais: DadosUsuario;
  aoFechar: () => void;
  aoSalvar: (dados: DadosUsuario) => void | Promise<void>;
  aoAlterarSenha?: () => void;
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function mascararTelefone(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export default function EditarDados({
  aberto,
  dadosIniciais,
  aoFechar,
  aoSalvar,
  aoAlterarSenha,
}: EditarDadosProps) {
  const [dados, setDados] = useState<DadosUsuario>(dadosIniciais);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (aberto) {
      setDados(dadosIniciais);
      setErro('');
    }
  }, [aberto, dadosIniciais]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && !salvando) aoFechar();
    };
    document.addEventListener('keydown', aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, aoFechar, salvando]);

  if (!aberto) return null;

  const digitosTelefone = dados.telefone.replace(/\D/g, '');
  const nomeValido = dados.nome.trim().length > 0;
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim());
  const telefoneValido = digitosTelefone.length === 0 || digitosTelefone.length >= 10;
  const formularioValido = nomeValido && emailValido && telefoneValido;

  const aoEnviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!formularioValido || salvando) return;
    setErro('');
    setSalvando(true);
    try {
      await aoSalvar({
        ...dados,
        nome: dados.nome.trim(),
        email: dados.email.trim(),
      });
    } catch (error: unknown) {
      setErro(
        extrairMensagemDeErro(error, 'Não foi possível salvar as alterações.')
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="editar-overlay"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !salvando) aoFechar();
      }}
    >
      <form
        className="editar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-titulo"
        onSubmit={aoEnviar}
        noValidate
      >
        <button
          type="button"
          className="editar-fechar"
          aria-label="Fechar"
          onClick={aoFechar}
          disabled={salvando}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <header className="editar-topo">
          <div className="editar-avatar">{iniciais(dados.nome)}</div>
          <div>
            <h2 id="editar-titulo">Editar meus dados</h2>
            <p>Mantenha seus dados atualizados para o dossiê.</p>
          </div>
        </header>

        <div className="editar-campo">
          <label htmlFor="editar-nome">Nome completo</label>
          <input
            id="editar-nome"
            type="text"
            autoComplete="name"
            value={dados.nome}
            disabled={salvando}
            onChange={(evento) => {
              setDados({ ...dados, nome: evento.target.value });
              setErro('');
            }}
          />
        </div>

        <div className="editar-linha">
          <div className="editar-campo">
            <label htmlFor="editar-cpf">CPF</label>
            <div className="editar-input-bloqueado">
              <input id="editar-cpf" type="text" value={dados.cpf} disabled />
              <span className="material-symbols-outlined">lock</span>
            </div>
          </div>

          <div className="editar-campo">
            <label htmlFor="editar-telefone">Telefone</label>
            <input
              id="editar-telefone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="(00) 00000-0000"
              value={dados.telefone}
              disabled={salvando}
              onChange={(evento) => {
                setDados({ ...dados, telefone: mascararTelefone(evento.target.value) });
                setErro('');
              }}
            />
          </div>
        </div>
        <p className="editar-ajuda editar-ajuda-linha">
          O CPF não pode ser alterado, pois identifica o seu processo.
        </p>

        <div className="editar-campo">
          <label htmlFor="editar-email">E-mail</label>
          <input
            id="editar-email"
            type="email"
            autoComplete="email"
            value={dados.email}
            disabled={salvando}
            onChange={(evento) => {
              setDados({ ...dados, email: evento.target.value });
              setErro('');
            }}
          />
          <p className="editar-ajuda">
            Ao trocar o e-mail, enviaremos um link de confirmação para o novo endereço.
          </p>
        </div>

        <div className="editar-senha">
          <span className="material-symbols-outlined editar-senha-icone">lock</span>
          <div className="editar-senha-texto">
            <strong>Senha</strong>
            <p>
              Por segurança, a troca de senha exige um código de 6 dígitos enviado ao
              seu e-mail.
            </p>
          </div>
          <button
            type="button"
            className="editar-senha-botao"
            onClick={aoAlterarSenha}
            disabled={salvando}
          >
            Alterar senha
          </button>
        </div>

        <MensagemEstado tipo="erro" mensagem={erro} />

        <footer className="editar-acoes">
          <button
            type="button"
            className="editar-cancelar"
            onClick={aoFechar}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="editar-salvar"
            disabled={!formularioValido || salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </footer>
      </form>
    </div>
  );
}