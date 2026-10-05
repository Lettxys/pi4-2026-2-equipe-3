import { useState } from 'react';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Registrar from './pages/Registrar';

type Tela =
  | 'landing'
  | 'login'
  | 'registrar';

function App() {

  const [tela, setTela] =
    useState<Tela>('landing');

  return (
    <>
      <Landing
        abrirLogin={() => setTela('login')}
        abrirRegistrar={() => setTela('registrar')}
      />

      {tela === 'login' && (
        <Login
          fechar={() => setTela('landing')}
          abrirRegistrar={() =>
            setTela('registrar')
          }
        />
      )}

      {tela === 'registrar' && (
        <Registrar
          fechar={() => setTela('landing')}
          abrirLogin={() =>
            setTela('login')
          }
        />
      )}
    </>
  );
}

export default App;