import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';
import {
  buscarChecklistDocumentos,
  buscarUsuarioLogado,
  enviarDocumento,
  extrairMensagemDeErro,
  temToken,
  validarEtapa,
} from '../services/api';
import {
  listarDocumentosDaEtapa,
  paraArquivo,
  salvarDocumento,
} from '../services/documentosSalvos';
import { montarPerfil, proximaEtapaComTela } from '../services/regrasPerfil';
import type {
  ChaveEtapaPerfil,
  RespostasPerfil,
} from '../services/regrasPerfil';
import {
  atualizarRespostasAtivas,
  lerRespostasAtivas,
} from '../services/respostasPerfil';

import './EtapaIdentificacao.css';
import './EtapaConcluida.css';
import './EtapaLaudo.css';

interface EtapaDocumentosMedicosProps {
  aoSair: () => void | Promise<void>;
  voltarTrilha: () => void;
  aoConcluir?: () => void;
  aoComecarProximaEtapa?: (chave?: ChaveEtapaPerfil) => void;
  aoEtapaConcluida?: () => void;
  aoNavegar?: (destino: DestinoMenu) => void;
  categoria?: string;
  totalEtapas?: number;
}

type StatusDocumento = 'pendente' | 'enviando' | 'conferido' | 'erro';

interface Documento {
  id: string;
  titulo: string;
  descricao: string;
  opcional?: boolean;
  status: StatusDocumento;
  progresso: number;
  arquivo: File | null;
  emitidoEm?: string;
  erro: string;
}

interface ModeloDocumento {
  id: string;
  titulo: string;
  descricao: string;
  opcional?: boolean;
}

const NUMERO_ETAPA_BACKEND = 2;
const ETAPA_DOCUMENTOS = 'documentos-medicos';
const TITULO_ETAPA_DOCUMENTOS = 'Documentos médicos';

const DIAS_LAUDO_ANTIGO = 180;
const DIAS_ATENCAO = 150;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png'];
const EXTENSOES_ACEITAS = ['pdf', 'jpg', 'jpeg', 'png'];
const TAMANHO_MAXIMO = 2 * 1024 * 1024;
const TEMPO_AVISO = 4000;

const DICAS = [
  'Confira se o laudo traz o CID e a descrição da deficiência.',
  'Veja se o documento está dentro do prazo de validade.',
  'Fotografe com boa luz e sem cortar as bordas do documento.',
  'Utilize algum aplicativo de digitalizar foto.',
];

const GUIA_PASSOS = [
  {
    titulo: 'Procure um serviço de saúde',
    descricao:
      'O laudo deve ser emitido por uma instituição de saúde do SUS (pública ou conveniada) ou pelo Detran-CE.',
  },
  {
    titulo: 'Peça o laudo para a isenção',
    descricao:
      'Explique ao médico que o laudo é para isenção de impostos na compra de um veículo. Leve seus documentos e os exames que você já tiver.',
  },
  {
    titulo: 'Confira o que o laudo precisa ter',
    descricao:
      'Ele deve trazer o CID, a descrição da deficiência e dizer se a incapacidade é reversível ou não.',
  },
  {
    titulo: 'Volte aqui com o laudo em mãos',
    descricao:
      'Quando estiver com o laudo, toque em "Já tenho meu laudo" para liberar o envio.',
  },
];

const DOCUMENTOS_DO_BACKEND: Record<string, ModeloDocumento> = {
  MEDICAL_REPORT_IPI: {
    id: 'MEDICAL_REPORT_IPI',
    titulo: 'Laudo médico para o IPI',
    descricao:
      'Laudo com CID e caracterização da deficiência, dentro do prazo de validade.',
  },
  MEDICAL_REPORT_ICMS: {
    id: 'MEDICAL_REPORT_ICMS',
    titulo: 'Laudo médico para o ICMS e o IPVA',
    descricao:
      'Laudo com CID e caracterização da deficiência, dentro do prazo de validade.',
  },
};

const DOCUMENTO_LAUDO: ModeloDocumento = {
  id: 'laudo',
  titulo: 'Laudo médico',
  descricao:
    'Laudo com CID e caracterização da deficiência, dentro do prazo de validade.',
};

const DOCUMENTO_LAUDO_VISUAL: ModeloDocumento = {
  id: 'laudo',
  titulo: 'Laudo oftalmológico',
  descricao:
    'Laudo oftalmológico com caracterização da deficiência, dentro do prazo de validade.',
};

const DOCUMENTOS_POR_CATEGORIA: Record<string, ModeloDocumento[]> = {
  auditiva: [
    {
      id: 'audiograma',
      titulo: 'Audiograma',
      descricao: 'Exame que comprova a perda auditiva bilateral.',
    },
  ],
  intelectual: [
    {
      id: 'responsavel-legal',
      titulo: 'Documento do responsável legal',
      descricao:
        'Envie se a pessoa tiver curador ou responsável legal. Se não houver, pode pular.',
      opcional: true,
    },
  ],
  autismo: [
    {
      id: 'responsavel-legal',
      titulo: 'Documento do responsável legal',
      descricao:
        'Envie se a pessoa tiver curador ou responsável legal. Se não houver, pode pular.',
      opcional: true,
    },
  ],
};

function documentosDaCategoria(categoria?: string): ModeloDocumento[] {
  const laudo = categoria === 'visual' ? DOCUMENTO_LAUDO_VISUAL : DOCUMENTO_LAUDO;
  const extras = categoria ? DOCUMENTOS_POR_CATEGORIA[categoria] ?? [] : [];

  return [laudo, ...extras];
}

function criarDocumentos(modelos: ModeloDocumento[]): Documento[] {
  return modelos.map((modelo) => ({
    ...modelo,
    status: 'pendente',
    progresso: 0,
    arquivo: null,
    erro: '',
  }));
}

function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function dataDeHoje(): string {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');

  return `${agora.getFullYear()}-${mes}-${dia}`;
}

function calcularDias(emissao: string): number | null {
  if (!emissao) {
    return null;
  }

  const data = new Date(`${emissao}T00:00:00`);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dias = Math.round((hoje.getTime() - data.getTime()) / MS_POR_DIA);

  return dias < 0 ? null : dias;
}

function textoDias(dias: number): string {
  return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

function IconeDocumento() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5M9 13h6M9 17h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeCheckCirculo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m8 12.5 3 3 5-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeCheckGrande() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeAlerta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7.5v5.5M12 16.2v.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V4m0 0L8 8m4-4 4 4M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeCadeado() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 10.5V7.5a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeInfo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 11v5M12 8v.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeSeta() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M14 8H2M7 3 2 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeSetaDireita() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 8h12M9 3l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeCheckPequeno() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="m3.5 8.5 3 3 6-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MedidorValidade() {
  const [emissao, setEmissao] = useState('');

  const dias = calcularDias(emissao);
  const situacao =
    dias === null
      ? null
      : dias >= DIAS_LAUDO_ANTIGO
        ? 'vencido'
        : dias >= DIAS_ATENCAO
          ? 'atencao'
          : 'ok';
  const percentual =
    dias === null ? 0 : Math.min(100, Math.round((dias / DIAS_LAUDO_ANTIGO) * 100));
  const restam = dias === null ? 0 : DIAS_LAUDO_ANTIGO - dias;

  let mensagem = 'Informe a data para ver se o laudo ainda está dentro do prazo.';

  if (situacao === 'ok') {
    mensagem = `Dentro do prazo. Ele passa a ser considerado antigo com ${DIAS_LAUDO_ANTIGO} dias.`;
  }

  if (situacao === 'atencao') {
    mensagem = `Atenção: em ${textoDias(restam)} este laudo passa a ser considerado antigo.`;
  }

  if (situacao === 'vencido') {
    mensagem = `Este laudo passou de ${DIAS_LAUDO_ANTIGO} dias e é considerado antigo. Emita um novo antes de enviar.`;
  }

  return (
    <section
      className={`etapa-medidor${situacao ? ` etapa-medidor-${situacao}` : ''}`}
    >
      <h2>Medidor de validade do laudo</h2>

      <p>
        Informe quando o laudo foi emitido. Assim conferimos se ele ainda está
        dentro do prazo.
      </p>

      <label className="etapa-medidor-campo">
        Data de emissão do laudo
        <input
          type="date"
          value={emissao}
          max={dataDeHoje()}
          onChange={(event) => setEmissao(event.target.value)}
        />
      </label>

      <div
        className="etapa-medidor-barra"
        role="progressbar"
        aria-label="Idade do laudo em dias"
        aria-valuemin={0}
        aria-valuemax={DIAS_LAUDO_ANTIGO}
        aria-valuenow={Math.min(dias ?? 0, DIAS_LAUDO_ANTIGO)}
      >
        <span style={{ width: `${percentual}%` }} />
      </div>

      <div className="etapa-medidor-escala">
        <span>Emitido hoje</span>
        <span>{DIAS_LAUDO_ANTIGO} dias</span>
      </div>

      <p className="etapa-medidor-texto" role="status">
        {dias !== null && <strong>Seu laudo tem {textoDias(dias)}. </strong>}
        {mensagem}
      </p>
    </section>
  );
}

function GuiaLaudo({ aoTenhoLaudo }: { aoTenhoLaudo: () => void }) {
  return (
    <section className="etapa-guia">
      <ol>
        {GUIA_PASSOS.map((passo) => (
          <li key={passo.titulo}>
            <div>
              <h2>{passo.titulo}</h2>
              <p>{passo.descricao}</p>
            </div>
          </li>
        ))}
      </ol>

      <button type="button" className="etapa-guia-botao" onClick={aoTenhoLaudo}>
        Já tenho meu laudo
      </button>
    </section>
  );
}

export default function EtapaDocumentosMedicos({
  aoSair,
  voltarTrilha,
  aoConcluir,
  aoComecarProximaEtapa,
  aoEtapaConcluida,
  aoNavegar,
  categoria,
  totalEtapas: totalEtapasInformado,
}: EtapaDocumentosMedicosProps) {
  const [respostas, setRespostas] = useState<RespostasPerfil | null>(
    lerRespostasAtivas
  );

  const categoriaEfetiva = categoria ?? respostas?.categoria;

  const [modelos, setModelos] = useState<ModeloDocumento[]>(() =>
    documentosDaCategoria(categoriaEfetiva)
  );
  const [documentos, setDocumentos] = useState<Documento[]>(() =>
    criarDocumentos(documentosDaCategoria(categoriaEfetiva))
  );
  const [processId, setProcessId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(temToken());
  const [arrastando, setArrastando] = useState('');
  const [aviso, setAviso] = useState('');
  const [erroEtapa, setErroEtapa] = useState('');
  const [concluindo, setConcluindo] = useState(false);
  const [etapaConcluida, setEtapaConcluida] = useState(false);

  const seletores = useRef<Record<string, HTMLInputElement | null>>({});
  const temporizadores = useRef<Record<string, number>>({});
  const envios = useRef<Record<string, number>>({});
  const temporizadorAviso = useRef<number>(0);
  const botaoProximaEtapa = useRef<HTMLButtonElement | null>(null);

  const modoReal = processId !== null;
  const modoGuia = respostas?.laudo === 'ainda-nao';
  const laudoAntigo = respostas?.laudo === 'antigo';

  const etapasDoPerfil = montarPerfil(respostas ?? {}).etapas;
  const posicaoNoPerfil = etapasDoPerfil.findIndex(
    (etapa) =>
      etapa.chave === 'documentos-medicos' || etapa.chave === 'obter-laudo'
  );
  const numeroEtapa =
    posicaoNoPerfil >= 0 ? posicaoNoPerfil + 1 : NUMERO_ETAPA_BACKEND;
  const totalEtapas = totalEtapasInformado ?? etapasDoPerfil.length;
  const proxima = proximaEtapaComTela(
    etapasDoPerfil,
    modoGuia ? 'obter-laudo' : 'documentos-medicos'
  );
  const numeroProxima = proxima ? proxima.numero : numeroEtapa + 1;
  const tituloProxima = proxima ? proxima.etapa.titulo : '';

  useEffect(() => {
    if (!temToken()) {
      return;
    }

    let ativo = true;

    async function carregar() {
      try {
        const eu = await buscarUsuarioLogado();

        if (!eu.activeProcessId) {
          return;
        }

        const checklist = await buscarChecklistDocumentos(eu.activeProcessId);
        const tipos = Array.from(
          new Set(
            checklist
              .map((item) => item.documentType)
              .filter((tipo) => tipo in DOCUMENTOS_DO_BACKEND)
          )
        );

        if (!ativo || tipos.length === 0) {
          return;
        }

        const reais = tipos.map((tipo) => DOCUMENTOS_DO_BACKEND[tipo]);
        const itensPorTipo = new Map(
          checklist.map((item) => [item.documentType, item] as const)
        );

        const iniciais = criarDocumentos(reais).map((doc) => {
          const item = itensPorTipo.get(doc.id);
          const enviado =
            Boolean(item?.isUploaded) &&
            item?.status !== 'REJECTED' &&
            item?.status !== 'EXPIRED';

          return enviado
            ? { ...doc, status: 'conferido' as const, progresso: 100 }
            : doc;
        });

        setProcessId(eu.activeProcessId);
        setModelos(reais);
        setDocumentos(iniciais);
      } catch {
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (carregando) {
      return;
    }

    let ativo = true;

    void listarDocumentosDaEtapa(ETAPA_DOCUMENTOS).then((salvos) => {
      if (!ativo || salvos.length === 0) {
        return;
      }

      setDocumentos((atual) =>
        atual.map((doc) => {
          const salvo = salvos.find((item) => item.documentoId === doc.id);
          const semArquivo =
            doc.status === 'pendente' ||
            (doc.status === 'conferido' && !doc.arquivo);

          if (!salvo || !semArquivo) {
            return doc;
          }

          return {
            ...doc,
            status: 'conferido',
            progresso: 100,
            arquivo: paraArquivo(salvo),
            erro: '',
          };
        })
      );
    });

    return () => {
      ativo = false;
    };
  }, [carregando]);

  useEffect(() => {
    const ativos = temporizadores.current;

    return () => {
      Object.values(ativos).forEach((id) => window.clearInterval(id));
      window.clearTimeout(temporizadorAviso.current);
    };
  }, []);

  useEffect(() => {
    if (!etapaConcluida) {
      return;
    }

    botaoProximaEtapa.current?.focus();

    function aoTeclar(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setEtapaConcluida(false);
      }
    }

    window.addEventListener('keydown', aoTeclar);

    return () => {
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [etapaConcluida]);

  const obrigatorios = documentos.filter((doc) => !doc.opcional);
  const conferidos = obrigatorios.filter(
    (doc) => doc.status === 'conferido'
  ).length;
  const total = obrigatorios.length;
  const porcentagem = total > 0 ? Math.round((conferidos / total) * 100) : 0;
  const faltam = total - conferidos;
  const temOpcional = documentos.some((doc) => doc.opcional);
  const enviandoAlgum = documentos.some((doc) => doc.status === 'enviando');

  function atualizarDocumento(id: string, mudancas: Partial<Documento>) {
    setDocumentos((atual) =>
      atual.map((doc) => (doc.id === id ? { ...doc, ...mudancas } : doc))
    );
  }

  function mostrarAviso(texto: string) {
    window.clearTimeout(temporizadorAviso.current);
    setAviso(texto);

    temporizadorAviso.current = window.setTimeout(
      () => setAviso(''),
      TEMPO_AVISO
    );
  }

  function pararEnvio(id: string) {
    const temporizador = temporizadores.current[id];

    if (temporizador) {
      window.clearInterval(temporizador);
      delete temporizadores.current[id];
    }
  }

  function tituloDoDocumento(id: string): string {
    return modelos.find((modelo) => modelo.id === id)?.titulo ?? 'Documento';
  }

  function simularEnvio(id: string, arquivo: File) {
    pararEnvio(id);

    atualizarDocumento(id, {
      status: 'enviando',
      progresso: 0,
      arquivo,
      erro: '',
    });

    let progresso = 0;

    temporizadores.current[id] = window.setInterval(() => {
      progresso = Math.min(100, progresso + 8 + Math.round(Math.random() * 8));

      if (progresso >= 100) {
        pararEnvio(id);
        atualizarDocumento(id, { status: 'conferido', progresso: 100 });
        mostrarAviso(`${tituloDoDocumento(id)} conferido`);
        void salvarDocumento({
          etapa: ETAPA_DOCUMENTOS,
          etapaTitulo: TITULO_ETAPA_DOCUMENTOS,
          documentoId: id,
          titulo: tituloDoDocumento(id),
          arquivo,
        });
        return;
      }

      atualizarDocumento(id, { progresso });
    }, 250);
  }

  async function enviarReal(id: string, arquivo: File, idProcesso: number) {
    pararEnvio(id);

    const numeroEnvio = (envios.current[id] ?? 0) + 1;
    envios.current[id] = numeroEnvio;

    atualizarDocumento(id, {
      status: 'enviando',
      progresso: 0,
      arquivo,
      erro: '',
    });

    let progresso = 0;

    temporizadores.current[id] = window.setInterval(() => {
      progresso = Math.min(90, progresso + 10);
      atualizarDocumento(id, { progresso });
    }, 250);

    try {
      await enviarDocumento(idProcesso, { file: arquivo, documentType: id });

      if (envios.current[id] !== numeroEnvio) {
        return;
      }

      pararEnvio(id);
      atualizarDocumento(id, { status: 'conferido', progresso: 100 });
      mostrarAviso(`${tituloDoDocumento(id)} conferido`);
      void salvarDocumento({
        etapa: ETAPA_DOCUMENTOS,
        etapaTitulo: TITULO_ETAPA_DOCUMENTOS,
        documentoId: id,
        titulo: tituloDoDocumento(id),
        arquivo,
      });
    } catch (error) {
      if (envios.current[id] !== numeroEnvio) {
        return;
      }

      pararEnvio(id);
      atualizarDocumento(id, {
        status: 'erro',
        progresso: 0,
        arquivo: null,
        erro: extrairMensagemDeErro(
          error,
          'Não foi possível enviar o documento. Tente novamente.'
        ),
      });
    }
  }

  function iniciarEnvio(id: string, arquivo: File) {
    setErroEtapa('');

    if (processId !== null) {
      void enviarReal(id, arquivo, processId);
    } else {
      simularEnvio(id, arquivo);
    }
  }

  function validarArquivo(arquivo: File): string {
    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? '';
    const extensaoOk = EXTENSOES_ACEITAS.includes(extensao);
    const tipoOk = !arquivo.type || TIPOS_ACEITOS.includes(arquivo.type);

    if (!extensaoOk || !tipoOk) {
      return `O arquivo "${arquivo.name}" não está em um formato aceito. Envie em PDF, JPG ou PNG.`;
    }

    if (arquivo.size === 0) {
      return `O arquivo "${arquivo.name}" está vazio. Envie outro arquivo.`;
    }

    if (arquivo.size > TAMANHO_MAXIMO) {
      return `O arquivo "${arquivo.name}" tem ${formatarTamanho(arquivo.size)} e passa do limite de 2 MB. Envie um arquivo menor.`;
    }

    return '';
  }

  function receberArquivo(id: string, arquivo: File | undefined) {
    if (!arquivo) {
      return;
    }

    const mensagemErro = validarArquivo(arquivo);

    if (mensagemErro) {
      pararEnvio(id);
      envios.current[id] = (envios.current[id] ?? 0) + 1;
      atualizarDocumento(id, {
        status: 'erro',
        progresso: 0,
        arquivo: null,
        erro: mensagemErro,
      });
      return;
    }

    iniciarEnvio(id, arquivo);
  }

  function aoEscolherArquivo(id: string, event: ChangeEvent<HTMLInputElement>) {
    receberArquivo(id, event.target.files?.[0]);
    event.target.value = '';
  }

  function aoSoltar(id: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setArrastando('');
    receberArquivo(id, event.dataTransfer.files?.[0]);
  }

  function abrirSeletor(id: string) {
    seletores.current[id]?.click();
  }

  function cancelarEnvio(id: string) {
    pararEnvio(id);
    envios.current[id] = (envios.current[id] ?? 0) + 1;
    atualizarDocumento(id, {
      status: 'pendente',
      progresso: 0,
      arquivo: null,
      erro: '',
    });
  }

  function verArquivo(arquivo: File | null) {
    if (!arquivo) {
      return;
    }

    const endereco = URL.createObjectURL(arquivo);
    window.open(endereco, '_blank', 'noopener');
  }

  function jaTenhoLaudo() {
    atualizarRespostasAtivas({ laudo: 'recente' });
    setRespostas(lerRespostasAtivas());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function concluirEtapa() {
    if (faltam > 0 || enviandoAlgum || concluindo) {
      return;
    }

    setErroEtapa('');

    if (processId !== null) {
      setConcluindo(true);

      try {
        const resultado = await validarEtapa(processId, NUMERO_ETAPA_BACKEND);

        if (!resultado.isValidated) {
          const mensagens = resultado.validationErrors
            .map((erro) => erro.message)
            .filter(Boolean);

          setErroEtapa(
            mensagens.length > 0
              ? mensagens.join(' ')
              : 'A etapa ainda não pôde ser validada.'
          );
          return;
        }
      } catch (error) {
        setErroEtapa(
          extrairMensagemDeErro(error, 'Não foi possível validar a etapa.')
        );
        return;
      } finally {
        setConcluindo(false);
      }
    }

    aoEtapaConcluida?.();
    setEtapaConcluida(true);
  }

  function irParaTrilha() {
    setEtapaConcluida(false);
    (aoConcluir ?? voltarTrilha)();
  }

  function comecarProximaEtapa() {
    setEtapaConcluida(false);

    if (proxima && aoComecarProximaEtapa) {
      aoComecarProximaEtapa(proxima.etapa.chave);
      return;
    }

    (aoConcluir ?? voltarTrilha)();
  }

  const textoStatus: Record<StatusDocumento, string> = {
    pendente: 'Pendente',
    enviando: 'Enviando...',
    conferido: 'Conferido',
    erro: 'Precisa corrigir',
  };

  return (
    <PainelLayout
      aoSair={aoSair}
      aoNavegar={aoNavegar}
      itemAtivo="processo"
      caminho={[
        'Meu processo',
        `Etapa ${numeroEtapa} · ${modoGuia ? 'Como conseguir seu laudo' : 'Documentos médicos'}`,
      ]}
    >
      {aviso && (
        <div className="etapa-toast" role="status">
          <span className="etapa-toast-icone">
            <IconeCheckCirculo />
          </span>
          {aviso}
        </div>
      )}

      <main className="etapa-content">
        <section className="etapa-main">
          <button type="button" className="etapa-voltar" onClick={voltarTrilha}>
            <IconeSeta />
            Voltar para a trilha
          </button>

          <div
            className="etapa-passos"
            role="progressbar"
            aria-label="Etapas do processo"
            aria-valuenow={numeroEtapa}
            aria-valuemin={1}
            aria-valuemax={totalEtapas}
          >
            {Array.from({ length: totalEtapas }, (_, indice) => (
              <span
                key={indice}
                className={indice < numeroEtapa ? 'ativo' : ''}
              />
            ))}
          </div>

          <p className="etapa-rotulo">
            ETAPA {numeroEtapa} DE {totalEtapas}
          </p>

          <h1 className="etapa-titulo">
            {modoGuia ? (
              <>
                Como conseguir seu <span>laudo médico</span>
              </>
            ) : (
              <>
                Documentos médicos: <span>laudos e exames</span>
              </>
            )}
          </h1>

          <p className="etapa-subtitulo">
            {modoGuia ? (
              'Você ainda não tem o laudo. Siga os passos abaixo e, quando estiver com ele em mãos, volte para enviar.'
            ) : (
              <>
                Envie {total === 1 ? 'o documento' : `os ${total} documentos`}{' '}
                abaixo para liberar a etapa {numeroProxima}.
                {temOpcional ? ' O documento do responsável legal é opcional.' : ''}{' '}
                Seu progresso é salvo automaticamente.
              </>
            )}
          </p>

          {modoGuia ? (
            <GuiaLaudo aoTenhoLaudo={jaTenhoLaudo} />
          ) : (
            <>
              {laudoAntigo && <MedidorValidade />}

              <div className="etapa-progresso">
                <strong>
                  {conferidos} de {total} conferidos
                </strong>

                <div
                  className="etapa-progresso-barra"
                  role="progressbar"
                  aria-label="Documentos conferidos"
                  aria-valuenow={porcentagem}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${porcentagem}%` }} />
                </div>

                <strong className="etapa-progresso-pct">{porcentagem}%</strong>
              </div>

              {carregando ? (
                <p className="etapa-subtitulo">Carregando documentos...</p>
              ) : (
                <div className="etapa-documentos">
                  {documentos.map((doc) => (
                    <article
                      key={doc.id}
                      className={`etapa-doc etapa-doc-${doc.status}`}
                    >
                      <div className="etapa-doc-icone">
                        <IconeDocumento />
                      </div>

                      <div className="etapa-doc-topo">
                        <div>
                          <h2>
                            {doc.titulo}
                            {doc.opcional && (
                              <span className="etapa-opcional"> · opcional</span>
                            )}
                          </h2>
                          <p>{doc.descricao}</p>
                        </div>

                        <span className={`etapa-selo etapa-selo-${doc.status}`}>
                          {doc.status === 'conferido' && <IconeCheckPequeno />}
                          {textoStatus[doc.status]}
                        </span>
                      </div>

                      <div className="etapa-doc-corpo">
                        <input
                          ref={(elemento) => {
                            seletores.current[doc.id] = elemento;
                          }}
                          type="file"
                          className="etapa-arquivo-oculto"
                          onChange={(event) => aoEscolherArquivo(doc.id, event)}
                          tabIndex={-1}
                          aria-hidden="true"
                        />

                        {doc.status === 'conferido' && doc.arquivo && (
                          <div className="etapa-arquivo">
                            <span className="etapa-arquivo-check">
                              <IconeCheckCirculo />
                            </span>

                            <span className="etapa-arquivo-nome">
                              {doc.arquivo.name} · {formatarTamanho(doc.arquivo.size)}
                            </span>

                            {doc.emitidoEm && (
                              <span className="etapa-arquivo-data">
                                Emitido em {doc.emitidoEm}
                              </span>
                            )}

                            <button
                              type="button"
                              className="etapa-link"
                              onClick={() => verArquivo(doc.arquivo)}
                            >
                              Ver
                            </button>

                            <button
                              type="button"
                              className="etapa-link"
                              onClick={() => abrirSeletor(doc.id)}
                            >
                              Substituir
                            </button>
                          </div>
                        )}

                        {doc.status === 'conferido' && !doc.arquivo && (
                          <div className="etapa-arquivo">
                            <span className="etapa-arquivo-check">
                              <IconeCheckCirculo />
                            </span>

                            <span className="etapa-arquivo-nome">
                              Documento já enviado
                            </span>

                            <button
                              type="button"
                              className="etapa-link"
                              onClick={() => abrirSeletor(doc.id)}
                            >
                              Substituir
                            </button>
                          </div>
                        )}

                        {doc.status === 'enviando' && doc.arquivo && (
                          <div className="etapa-envio">
                            <div className="etapa-envio-linha">
                              <span className="etapa-envio-nome">
                                Enviando {doc.arquivo.name} · {formatarTamanho(doc.arquivo.size)}
                              </span>
                              <strong>{doc.progresso}%</strong>
                            </div>

                            <div className="etapa-envio-barra">
                              <span style={{ width: `${doc.progresso}%` }} />
                            </div>

                            <div className="etapa-envio-linha">
                              <span className="etapa-envio-info">
                                Conferindo formato, tamanho e data...
                              </span>
                              <button
                                type="button"
                                className="etapa-cancelar"
                                onClick={() => cancelarEnvio(doc.id)}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {doc.status === 'erro' && (
                          <>
                            <div className="etapa-erro-caixa" role="alert">
                              <IconeAlerta />
                              <p>{doc.erro}</p>
                            </div>

                            <button
                              type="button"
                              className="etapa-botao-outro"
                              onClick={() => abrirSeletor(doc.id)}
                            >
                              Enviar outro arquivo
                            </button>
                          </>
                        )}

                        {doc.status === 'pendente' && (
                          <>
                            <ul className="etapa-formatos">
                              <li>PDF, JPG ou PNG</li>
                              <li>Até 2 MB</li>
                              <li>Legível e completo</li>
                            </ul>

                            <div
                              className={`etapa-soltar${
                                arrastando === doc.id ? ' arrastando' : ''
                              }`}
                              onDragOver={(event) => {
                                event.preventDefault();
                                setArrastando(doc.id);
                              }}
                              onDragLeave={() => setArrastando('')}
                              onDrop={(event) => aoSoltar(doc.id, event)}
                            >
                              <IconeUpload />

                              <span>
                                Arraste o arquivo aqui ou{' '}
                                <button
                                  type="button"
                                  onClick={() => abrirSeletor(doc.id)}
                                >
                                  selecione do computador
                                </button>
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <aside className="etapa-lateral">
          <section className="etapa-dicas">
            <h2>Dicas desta etapa</h2>

            <ul>
              {DICAS.map((dica) => (
                <li key={dica}>{dica}</li>
              ))}
            </ul>
          </section>

          {!modoGuia && (
            <section className="etapa-concluir">
              <h2>Concluir etapa</h2>

              <p>
                Quando {total === 1 ? 'o documento estiver conferido' : `os ${total} documentos estiverem conferidos`}
                , a etapa {numeroProxima} será liberada.
              </p>

              <button
                type="button"
                className="etapa-concluir-botao"
                disabled={faltam > 0 || enviandoAlgum || concluindo || carregando}
                onClick={() => void concluirEtapa()}
              >
                {faltam > 0 && <IconeCadeado />}
                {concluindo ? 'Validando...' : `Concluir etapa ${numeroEtapa}`}
              </button>

              <span className="etapa-concluir-info">
                {faltam > 0
                  ? `Faltam ${faltam} ${faltam === 1 ? 'documento' : 'documentos'}`
                  : 'Todos os documentos conferidos'}
              </span>

              {erroEtapa && (
                <div className="etapa-erro-caixa" role="alert">
                  <IconeAlerta />
                  <p>{erroEtapa}</p>
                </div>
              )}
            </section>
          )}

          {!carregando && !modoReal && !modoGuia && (
            <section className="etapa-aviso">
              <IconeInfo />

              <p>
                Modo de demonstração: não há processo ativo com documentos
                desta etapa, então os envios não são salvos.
              </p>
            </section>
          )}

          <section className="etapa-aviso">
            <IconeInfo />

            <p>
              O isenta+ confere formato, tamanho e datas dos arquivos. A
              análise final do pedido é feita pela Receita Federal.
            </p>
          </section>
        </aside>
      </main>

      {etapaConcluida && (
        <div
          className="etapa-concluida-overlay"
          onClick={() => setEtapaConcluida(false)}
        >
          <section
            className="etapa-concluida-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="etapa-concluida-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="etapa-concluida-icone">
              <IconeCheckGrande />
            </span>

            <h2 id="etapa-concluida-titulo">
              Etapa {numeroEtapa} concluída!
            </h2>

            <p className="etapa-concluida-texto">
              Seus documentos médicos foram conferidos.
              <br />
              <strong>
                Etapa {numeroProxima}
                {tituloProxima ? ` · ${tituloProxima}` : ''}
              </strong>{' '}
              liberada.
            </p>

            <div className="etapa-concluida-passos" aria-hidden="true">
              {Array.from({ length: totalEtapas }, (_, indice) => (
                <span
                  key={indice}
                  className={
                    indice < numeroEtapa
                      ? 'ativo'
                      : indice === numeroEtapa
                        ? 'proxima'
                        : ''
                  }
                />
              ))}
            </div>

            <div className="etapa-concluida-acoes">
              <button
                ref={botaoProximaEtapa}
                type="button"
                className="etapa-concluida-primario"
                onClick={comecarProximaEtapa}
              >
                Começar etapa {numeroProxima}
                <IconeSetaDireita />
              </button>

              <button
                type="button"
                className="etapa-concluida-secundario"
                onClick={irParaTrilha}
              >
                Voltar à trilha
              </button>
            </div>
          </section>
        </div>
      )}
    </PainelLayout>
  );
}