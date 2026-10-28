import { useEffect, useState } from 'react';

import Landing from './pages/Landing';
import Calculadora from './pages/Calculadora';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Registrar from './pages/Registrar';
import ForgotPassword from './pages/ForgotPassword';
import VerificarCodigo from './pages/VerificarCodigo';
import ResetPassword from './pages/ResetPassword';
import Overview from './pages/Overview';
import EtapaIdentificacao from './pages/EtapaIdentificacao';
import Documentos from './pages/Documentos';
import type { DestinoMenu } from './components/PainelLayout';
import {
  EVENTO_SESSAO_EXPIRADA,
  buscarUsuarioLogado,
  sair,
  temToken,
} from './services/api';

type Pagina =
  | 'landing'
  | 'calculadora'
  | 'quiz'
  | 'overview'
  | 'etapa-identificacao'
  | 'documentos';

type Modal =
  | 'login'
  | 'registrar'
  | 'ForgotPassword'
  | 'VerificarCodigo'
  | 'ResetPassword'
  | null;

// Telas internas: só abrem com usuário autenticado.
// As demais (landing, calculadora, quiz e os modais) são públicas.
const PAGINAS_PROTEGIDAS: Pagina[] = [
  'overview',
  'etapa-identificacao',
  'documentos',
];

function ehProtegida(pagina: Pagina): boolean {
  return PAGINAS_PROTEGIDAS.includes(pagina);
}

function App() {
  const [pagina, setPagina] = useState<Pagina>('landing');
  const [modal, setModal] = useState<Modal>(null);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [tokenRedefinicao, setTokenRedefinicao] = useState('');
  const [verificandoSessao, setVerificandoSessao] = useState(temToken());
  // Tela interna que a pessoa tentou abrir sem estar logada (volta para ela após o login)
  const [destinoPendente, setDestinoPendente] = useState<Pagina | null>(null);

  // Ao abrir o app: se existe token salvo, confirma com o servidor e vai ao Overview
  useEffect(() => {
    if (!temToken()) {
      return;
    }

    buscarUsuarioLogado()
      .then(() => setPagina('overview'))
      .catch(() => {
        // 401: o token já foi limpo e a pessoa fica na landing.
        // Outros erros (ex.: servidor fora do ar): também fica na landing.
      })
      .finally(() => setVerificandoSessao(false));
  }, []);

  // Se o servidor recusar o token durante o uso, volta para a landing
  useEffect(() => {
    function aoExpirar() {
      setPagina('landing');
      setModal(null);
    }

    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);

    return () => {
      window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    };
  }, []);

  function irPara(destino: Pagina) {
    // Guard: tela interna sem token abre o login e guarda o destino
    if (ehProtegida(destino) && !temToken()) {
      setDestinoPendente(destino);
      setPagina('landing');
      setModal('login');
      return;
    }

    setPagina(destino);
    setModal(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Menu lateral do painel: "Visão geral" e "Meu processo" abrem o Overview
  function navegar(destino: DestinoMenu) {
    irPara(destino === 'documentos' ? 'documentos' : 'overview');
  }

  async function deslogar() {
    try {
      await sair();
    } catch {
      // O token é removido do localStorage mesmo se a requisição falhar
    }

    setDestinoPendente(null);
    irPara('landing');
  }

  function abrirRedefinicaoSenha(token: string) {
    setTokenRedefinicao(token);
    setModal('ResetPassword');
  }

  function voltarLogin() {
    setEmailRecuperacao('');
    setTokenRedefinicao('');
    setModal('login');
  }

  function fecharModal() {
    setEmailRecuperacao('');
    setTokenRedefinicao('');
    setDestinoPendente(null);
    setModal(null);
  }

  // Login aceito: volta para a tela que a pessoa tentou abrir (ou Overview)
  function aoEntrar() {
    const destino = destinoPendente ?? 'overview';
    setDestinoPendente(null);
    irPara(destino);
  }

  // Segunda camada do guard: mesmo que o estado aponte para uma tela interna,
  // sem token ela não é renderizada (ex.: token removido em outra aba)
  const paginaAtual: Pagina =
    ehProtegida(pagina) && !temToken() ? 'landing' : pagina;

  if (verificandoSessao) {
    return null;
  }

  return (
    <>
      {paginaAtual === 'landing' && (
        <Landing
          abrirLogin={() => setModal('login')}
          abrirRegistrar={() => setModal('registrar')}
          abrirCalculadora={() => irPara('calculadora')}
          abrirQuiz={() => irPara('quiz')}
        />
      )}

      {paginaAtual === 'calculadora' && (
        <Calculadora
          voltarInicio={() => irPara('landing')}
          abrirLogin={() => setModal('login')}
          abrirQuiz={() => irPara('quiz')}
        />
      )}

      {paginaAtual === 'quiz' && (
        <Quiz
          voltarInicio={() => irPara('landing')}
          abrirLogin={() => setModal('login')}
        />
      )}

      {paginaAtual === 'overview' && (
        <Overview
          aoSair={deslogar}
          aoComecarEtapa={() => irPara('etapa-identificacao')}
          aoNavegar={navegar}
        />
      )}

      {paginaAtual === 'etapa-identificacao' && (
        <EtapaIdentificacao
          aoSair={deslogar}
          voltarTrilha={() => irPara('overview')}
          aoConcluir={() => irPara('overview')}
          aoNavegar={navegar}
        />
      )}

      {paginaAtual === 'documentos' && (
        <Documentos
          aoSair={deslogar}
          aoNavegar={navegar}
          irParaEtapa={() => irPara('etapa-identificacao')}
        />
      )}

      {modal === 'login' && (
        <Login
          fechar={fecharModal}
          abrirRegistrar={() => setModal('registrar')}
          abrirForgotPassword={() => setModal('ForgotPassword')}
          aoEntrar={aoEntrar}
        />
      )}

      {modal === 'ForgotPassword' && (
        <ForgotPassword
          onVoltar={() => setModal('login')}
          onFechar={fecharModal}
          onCodigoEnviado={(email) => {
            setEmailRecuperacao(email);
            setModal('VerificarCodigo');
          }}
        />
      )}

      {modal === 'VerificarCodigo' && (
        <VerificarCodigo
          email={emailRecuperacao}
          onVoltar={() => setModal('ForgotPassword')}
          onFechar={fecharModal}
          onVerificado={abrirRedefinicaoSenha}
        />
      )}

      {modal === 'ResetPassword' && (
        <ResetPassword
          token={tokenRedefinicao}
          fechar={fecharModal}
          voltarLogin={voltarLogin}
        />
      )}

      {modal === 'registrar' && (
        <Registrar
          fechar={fecharModal}
          abrirLogin={() => setModal('login')}
        />
      )}
    </>
  );
}

export default App;