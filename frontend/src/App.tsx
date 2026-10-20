import { useState } from 'react';

import Landing from './pages/Landing';
import Calculadora from './pages/Calculadora';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Registrar from './pages/Registrar';
import ForgotPassword from './pages/ForgotPassword';
import VerificarCodigo from './pages/VerificarCodigo';
import ResetPassword from './pages/ResetPassword';

type Pagina = 'landing' | 'calculadora' | 'quiz';

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

  function irPara(destino: Pagina) {
    setPagina(destino);
    window.scrollTo({ top: 0 });
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

      {modal === 'login' && (
        <Login
          fechar={fecharModal}
          abrirRegistrar={() => setModal('registrar')}
          abrirForgotPassword={() => setModal('ForgotPassword')}
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