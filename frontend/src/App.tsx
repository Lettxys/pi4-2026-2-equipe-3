import { useState } from 'react';

import Menu from './components/Menu';

import Tela1 from './pages/Tela1';
import Tela2 from './pages/Tela2';
import Tela3 from './pages/Tela3';
import Tela4 from './pages/Tela4';
import Tela5 from './pages/Tela5';

export default function App() {
  const [tela, setTela] = useState(1);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Menu mudarTela={setTela} />

      <main className="flex-1 flex items-center justify-center p-4">
        {tela === 1 && <Tela1 />}
        {tela === 2 && <Tela2 />}
        {tela === 3 && <Tela3 />}
        {tela === 4 && <Tela4 />}
        {tela === 5 && <Tela5 />}
      </main>
    </div>
  );
}