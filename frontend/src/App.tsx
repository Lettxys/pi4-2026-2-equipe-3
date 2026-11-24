import { useEffect, useState } from 'react';

import Landing from './pages/Landing';
import Calculadora from './pages/Calculadora';
import Quiz from './pages/Quiz';
import QuizPerfil from './pages/QuizPerfil';
import Login from './pages/Login';
import Registrar from './pages/Registrar';
import ForgotPassword from './pages/ForgotPassword';
import VerificarCodigo from './pages/VerificarCodigo';
import ResetPassword from './pages/ResetPassword';
import Overview from './pages/Overview';
import EtapaIdentificacao from './pages/EtapaIdentificacao';
import EtapaRepresentante from './pages/EtapaRepresentante';
import EtapaDocumentosMedicos from './pages/EtapaDocumentosMedicos';
import EtapaCondutores from './pages/EtapaCondutores';
import EtapaComprovacaoPerda from './pages/EtapaComprovacaoPerda';
import EtapaRenda from './pages/EtapaRenda';
import Documentos from './pages/Documentos';
import type { DestinoMenu } from './components/PainelLayout';
import EtapaVeiculo from './pages/EtapaVeiculo';
import EtapaRevisao from './pages/EtapaRevisao';
import {
  EVENTO_SESSAO_EXPIRADA,
  buscarUsuarioLogado,
  sair,
  temToken,
} from './services/api';
import { removerDocumentosDaEtapa } from './services/documentosSalvos';
import {
  desmarcarEtapaConcluida,
  limparEtapasConcluidas,
  marcarEtapaConcluida,
} from './services/progressoEtapas';
import {
  etapasAfetadasPorMudanca,
  montarPerfil,
} from './services/regrasPerfil';
import type { ChaveEtapaPerfil, RespostasPerfil } from './services/regrasPerfil';
import {
  ativarRespostasDoUsuario,
  lerRespostasAtivas,
  limparRespostasAtivas,
  salvarRespostasDoUsuario,
  temRespostasDoUsuario,
} from './services/respostasPerfil';

type Pagina =
  | 'landing'
  | 'calculadora'
  | 'quiz'
  | 'quiz-perfil'
  | 'overview'
  | 'etapa-identificacao'
  | 'etapa-representante'
  | 'etapa-documentos-medicos'
  | 'etapa-condutores'
  | 'etapa-comprovacao-perda'
  | 'etapa-renda'
  | 'etapa-veiculo'
  | 'etapa-revisao'
  | 'documentos';

type Modal =
  | 'login'
  | 'registrar'
  | 'ForgotPassword'
  | 'VerificarCodigo'
  | 'ResetPassword'
  | null;

const PAGINAS_PROTEGIDAS: Pagina[] = [
  'quiz-perfil',
  'overview',
  'etapa-identificacao',
  'etapa-representante',
  'etapa-documentos-medicos',
  'etapa-condutores',
  'etapa-comprovacao-perda',
  'etapa-renda',
  'etapa-veiculo',
  'etapa-revisao',
  'documentos',
];

function ehProtegida(pagina: Pagina): boolean {
  return PAGINAS_PROTEGIDAS.includes(pagina);
}

function beneficiarioEhCondutor(): boolean {
  return montarPerfil(lerRespostasAtivas() ?? {}).situacao === 'pcd-condutor';
}

function App() {
  const [pagina, setPagina] = useState<Pagina>('overview');
  const [modal, setModal] = useState<Modal>(null);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [tokenRedefinicao, setTokenRedefinicao] = useState('');
  const [verificandoSessao, setVerificandoSessao] = useState(temToken());
  const [destinoPendente, setDestinoPendente] = useState<Pagina | null>(null);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);

  useEffect(() => {
    if (!temToken()) {
      return;
    }

    buscarUsuarioLogado()
      .then((eu) => {
        setUsuarioId(eu.userId);
        ativarRespostasDoUsuario(eu.userId);
        setPagina(temRespostasDoUsuario(eu.userId) ? 'overview' : 'quiz-perfil');
      })
      .catch(() => undefined)
      .finally(() => setVerificandoSessao(false));
  }, []);

  useEffect(() => {
    function aoExpirar() {
      limparEtapasConcluidas();
      limparRespostasAtivas();
      setUsuarioId(null);
      setPagina('landing');
      setModal(null);
    }

    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);

    return () => {
      window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    };
  }, []);

  function irPara(destino: Pagina) {
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

  function navegar(destino: DestinoMenu) {
    if (destino === 'refazer-quiz') {
      irPara('quiz-perfil');
      return;
    }

    irPara(destino === 'documentos' ? 'documentos' : 'overview');
  }

  function abrirEtapa(chave?: ChaveEtapaPerfil) {
    if (chave === 'identificacao') irPara('etapa-identificacao');
    else if (chave === 'representante') irPara('etapa-representante');
    else if (chave === 'documentos-medicos' || chave === 'obter-laudo')
      irPara('etapa-documentos-medicos');
    else if (chave === 'condutores' || chave === 'minha-cnh')
      irPara('etapa-condutores');
    else if (chave === 'comprovacao-perda') irPara('etapa-comprovacao-perda');
    else if (chave === 'renda') irPara('etapa-renda');
    else if (chave === 'veiculo') irPara('etapa-veiculo');
    else if (chave === 'revisao') irPara('etapa-revisao');
    else irPara('overview');
  }

  async function deslogar() {
    await sair().catch(() => undefined);

    limparEtapasConcluidas();
    limparRespostasAtivas();
    setUsuarioId(null);
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

  async function aoEntrar() {
    const destino = destinoPendente ?? 'overview';
    setDestinoPendente(null);

    try {
      const eu = await buscarUsuarioLogado();
      setUsuarioId(eu.userId);
      ativarRespostasDoUsuario(eu.userId);
      irPara(temRespostasDoUsuario(eu.userId) ? destino : 'quiz-perfil');
    } catch {
      irPara(destino);
    }
  }

  async function concluirQuizPerfil(respostas: RespostasPerfil) {
    const afetadas = etapasAfetadasPorMudanca(lerRespostasAtivas(), respostas);

    for (const chave of afetadas) {
      await removerDocumentosDaEtapa(chave);
      desmarcarEtapaConcluida(chave);
    }

    salvarRespostasDoUsuario(usuarioId, respostas);
    irPara('overview');
  }

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

      {paginaAtual === 'quiz-perfil' && (
        <QuizPerfil
          voltarInicio={() => irPara('landing')}
          concluir={concluirQuizPerfil}
        />
      )}

      {paginaAtual === 'overview' && (
        <Overview
          aoSair={deslogar}
          aoComecarEtapa={(_numero, _titulo, chave) => abrirEtapa(chave)}
          aoNavegar={navegar}
        />
      )}

      {paginaAtual === 'etapa-identificacao' && (
        <EtapaIdentificacao
          aoSair={deslogar}
          voltarTrilha={() => irPara('overview')}
          aoConcluir={() => irPara('overview')}
          aoComecarEtapa2={abrirEtapa}
          aoEtapaConcluida={() => marcarEtapaConcluida('identificacao')}
          aoNavegar={navegar}
        />
      )}

      {paginaAtual === 'etapa-representante' && (
        <EtapaRepresentante
          aoSair={deslogar}
          voltarTrilha={() => irPara('overview')}
          aoConcluir={() => irPara('overview')}
          aoComecarProximaEtapa={abrirEtapa}
          aoEtapaConcluida={() => marcarEtapaConcluida('representante')}
          aoNavegar={navegar}
        />
      )}

      {paginaAtual === 'etapa-documentos-medicos' && (
        <EtapaDocumentosMedicos
          aoSair={deslogar}
          voltarTrilha={() => irPara('overview')}
          aoConcluir={() => irPara('overview')}
          aoComecarProximaEtapa={abrirEtapa}
          aoEtapaConcluida={() => marcarEtapaConcluida('documentos-medicos')}
          aoNavegar={navegar}
        />
      )}

      {paginaAtual === 'etapa-condutores' && (
        <EtapaCondutores
          aoSair={deslogar}
          voltarTrilha={() => irPara('overview')}
          aoConcluir={() => irPara('overview')}
          aoComecarProximaEtapa={abrirEtapa}
          aoEtapaConcluida={() =>
            marcarEtapaConcluida(
              beneficiarioEhCondutor() ? 'minha-cnh' : 'condutores'
            )
          }
          aoNavegar={navegar}
          beneficiarioEhCondutor={beneficiarioEhCondutor()}
        />
      )}

      {paginaAtual === 'etapa-comprovacao-perda' && (
        <EtapaComprovacaoPerda
          aoSair={deslogar}
          voltarTrilha={() => irPara('overview')}
          aoConcluir={() => irPara('overview')}
          aoComecarProximaEtapa={abrirEtapa}
          aoEtapaConcluida={() => marcarEtapaConcluida('comprovacao-perda')}
          aoNavegar={navegar}
        />
      )}

      {paginaAtual === 'etapa-renda' && (
        <EtapaRenda
          aoSair={deslogar}
          voltarTrilha={() => irPara('overview')}
          aoConcluir={() => irPara('overview')}
          aoComecarEtapa2={abrirEtapa}
          aoEtapaConcluida={() => marcarEtapaConcluida('renda')}
          aoNavegar={navegar}
        />
      )}

      {paginaAtual === 'etapa-veiculo' && (
        <EtapaVeiculo
          aoSair={deslogar}
          voltarTrilha={() => irPara('overview')}
          aoConcluir={() => irPara('overview')}
          aoComecarProximaEtapa={abrirEtapa}
          aoEtapaConcluida={() => marcarEtapaConcluida('veiculo')}
          aoNavegar={navegar}
          abrirCalculadora={() => irPara('calculadora')}
        />
      )}

      {paginaAtual === 'etapa-revisao' && (
        <EtapaRevisao
          aoSair={deslogar}
          voltarTrilha={() => irPara('overview')}
          aoNavegar={navegar}
          aoEditar={abrirEtapa}
          aoEtapaConcluida={() => marcarEtapaConcluida('revisao')}
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