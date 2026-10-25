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
  | 'overview';

type Modal =
  | 'login'
  | 'registrar'
  | 'ForgotPassword'
  | 'VerificarCodigo'
  | 'ResetPassword'
  | null;

function App() {
  const [pagina, setPagina] = useState<Pagina>('landing');
  const [modal, setModal] = useState<Modal>(null);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [tokenRedefinicao, setTokenRedefinicao] = useState('');
  const [verificandoSessao, setVerificandoSessao] = useState(temToken());

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
    setPagina(destino);
    setModal(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deslogar() {
    try {
      await sair();
    } catch {
      // O token é removido do localStorage mesmo se a requisição falhar
    }

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
    setModal(null);
  }

  if (verificandoSessao) {
    return null;
  }

  return (
    <>
      {pagina === 'landing' && (
        <Landing
          abrirLogin={() => setModal('login')}
          abrirRegistrar={() => setModal('registrar')}
          abrirCalculadora={() => irPara('calculadora')}
          abrirQuiz={() => irPara('quiz')}
        />
      )}

      {pagina === 'calculadora' && (
        <Calculadora
          voltarInicio={() => irPara('landing')}
          abrirLogin={() => setModal('login')}
          abrirQuiz={() => irPara('quiz')}
        />
      )}

      {pagina === 'quiz' && (
        <Quiz
          voltarInicio={() => irPara('landing')}
          abrirLogin={() => setModal('login')}
        />
      )}

      {pagina === 'overview' && <Overview aoSair={deslogar} />}

      {modal === 'login' && (
        <Login
          fechar={fecharModal}
          abrirRegistrar={() => setModal('registrar')}
          abrirForgotPassword={() => setModal('ForgotPassword')}
          aoEntrar={() => irPara('overview')}
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