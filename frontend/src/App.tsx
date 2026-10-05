import { useState } from 'react';

import Landing from './pages/Landing';
import Calculadora from './pages/Calculadora';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Registrar from './pages/Registrar';

type Pagina = 'landing' | 'calculadora' | 'quiz';
type Modal = 'login' | 'registrar' | null;

function App() {
  const [pagina, setPagina] = useState<Pagina>('landing');
  const [modal, setModal] = useState<Modal>(null);

  function irPara(destino: Pagina) {
    setPagina(destino);
    window.scrollTo({ top: 0 });
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
          fechar={() => setModal(null)}
          abrirRegistrar={() => setModal('registrar')}
        />
      )}

      {modal === 'registrar' && (
        <Registrar
          fechar={() => setModal(null)}
          abrirLogin={() => setModal('login')}
        />
      )}
    </>
  );
}

export default App;