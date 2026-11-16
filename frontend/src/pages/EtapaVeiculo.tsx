import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';
import { buscarUsuarioLogado, temToken } from '../services/api';
import { montarPerfil } from '../services/regrasPerfil';
import { lerRespostasAtivas } from '../services/respostasPerfil';

import './EtapaVeiculo.css';

interface EtapaVeiculoProps {
  aoSair: () => void | Promise<void>;
  voltarTrilha: () => void;
  aoConcluir?: () => void;
  aoNavegar?: (destino: DestinoMenu) => void;
  abrirCalculadora?: () => void;
}

type OpcaoSimNao = 'sim' | 'nao' | 'nao-sei';
type EstadoRequisito = 'atendido' | 'nao-atendido' | 'pendente';

interface DadosVeiculo {
  marca: string;
  modelo: string;
  anoModelo: string;
  motorizacao: string;
  portas: string;
  fabricadoBrasil: OpcaoSimNao | '';
  valorTabela: string;
  concessionaria: string;
}

const CHAVE_ETAPA = 'veiculo';
const NUMERO_ETAPA = 5;
const TOTAL_ETAPAS = 6;

const TETO_VALOR = 200000;
const ICMS_PADRAO = 12;
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;
const EXTENSOES_ACEITAS = ['.pdf', '.jpg', '.jpeg', '.png'];
const CHAVE_RASCUNHO = 'veiculo-rascunho';

const MARCAS = [
  'Volkswagen',
  'Chevrolet',
  'Fiat',
  'Hyundai',
  'Honda',
  'Toyota',
  'Renault',
  'Outra',
];
const ANOS_MODELO = ['2026 / 2027', '2026 / 2026', '2025 / 2026', '2025 / 2025'];
const MOTORIZACOES = [
  '1.0 flex turbo',
  '1.0 flex',
  '1.3 flex',
  '1.5 flex',
  '1.6 flex',
  '2.0 flex',
  '2.0 turbo',
];
const PORTAS = ['4 portas', '5 portas', '2 portas'];

const IPI_POR_MOTOR: Record<string, number> = {
  '1.0 flex turbo': 5,
  '1.0 flex': 3,
  '1.3 flex': 7.05,
  '1.5 flex': 7.05,
  '1.6 flex': 7.05,
  '2.0 flex': 7.05,
  '2.0 turbo': 7.05,
};

const DADOS_VAZIOS: DadosVeiculo = {
  marca: '',
  modelo: '',
  anoModelo: '',
  motorizacao: '',
  portas: '',
  fabricadoBrasil: '',
  valorTabela: '',
  concessionaria: '',
};

const ROTULO_OPCAO: Record<OpcaoSimNao, string> = {
  sim: 'Sim',
  nao: 'Não',
  'nao-sei': 'Não sei',
};

const OPCOES_SIM_NAO: OpcaoSimNao[] = ['sim', 'nao', 'nao-sei'];

function formatarMoeda(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 10);
  if (!digitos) return '';
  return (Number(digitos) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function lerValor(texto: string): number {
  const digitos = texto.replace(/\D/g, '');
  return digitos ? Number(digitos) / 100 : 0;
}

function lerMotor(texto: string): number {
  const encontrado = texto.match(/\d+(?:[.,]\d+)?/)?.[0];
  return encontrado ? Number(encontrado.replace(',', '.')) : Number.NaN;
}

function formatarReais(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

function formatarTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function lerRascunho(chave: string): DadosVeiculo | null {
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return null;

    const lido = JSON.parse(bruto) as Partial<DadosVeiculo>;
    const dados = { ...DADOS_VAZIOS };
    for (const campo of Object.keys(DADOS_VAZIOS) as (keyof DadosVeiculo)[]) {
      if (typeof lido[campo] === 'string') {
        (dados as Record<string, string>)[campo] = lido[campo] as string;
      }
    }
    return dados;
  } catch {
    return null;
  }
}

function salvarRascunho(chave: string, dados: DadosVeiculo) {
  try {
    localStorage.setItem(chave, JSON.stringify(dados));
  } catch {
    return;
  }
}

function IconeSeta() {
  return (
    <svg width="16" height="12" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M17 7H1M7 1L1 7L7 13"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}

function IconeSetaDireita() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M2 8h12M9 3l5 5-5 5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}

function IconeCheckRequisito() {
  return (
    <svg width="10" height="8" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M1 5L4.5 8.5L11 1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}

function IconeCheckCirculo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M6 10.5L9 13.5L14.5 7.5M1 10C1 5.0293 5.0293 1 10 1C14.9707 1 19 5.0293 19 10C19 14.9707 14.9707 19 10 19C5.0293 19 1 14.9707 1 10Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}

function IconeUpload() {
  return (
    <svg width="18" height="18" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M11.4746 15.225V1.72498M5.47461 6.97498L11.4746 0.974976L17.4746 6.97498M0.974609 15.225V21.225H21.9746V15.225"
        strokeWidth="1.95"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
}

export default function EtapaVeiculo({
  aoSair,
  voltarTrilha,
  aoConcluir,
  aoNavegar,
  abrirCalculadora,
}: EtapaVeiculoProps) {
  const [dados, setDados] = useState<DadosVeiculo>(DADOS_VAZIOS);
  const [proposta, setProposta] = useState<File | null>(null);
  const [erroProposta, setErroProposta] = useState('');
  const [arrastando, setArrastando] = useState(false);
  const [etapaConcluida, setEtapaConcluida] = useState(false);
  const [chaveRascunho, setChaveRascunho] = useState<string | null>(null);
  const [respostas] = useState(lerRespostasAtivas);
  const inputProposta = useRef<HTMLInputElement>(null);

  const etapasDoPerfil = montarPerfil(respostas ?? {}).etapas;
  const posicaoNoPerfil = etapasDoPerfil.findIndex(
    (etapa) => etapa.chave === CHAVE_ETAPA
  );
  const numeroEtapa = posicaoNoPerfil >= 0 ? posicaoNoPerfil + 1 : NUMERO_ETAPA;
  const totalEtapas = etapasDoPerfil.length > 0 ? etapasDoPerfil.length : TOTAL_ETAPAS;

  useEffect(() => {
    let ativo = true;

    async function carregarRascunho() {
      if (!temToken()) return;
      try {
        const eu = await buscarUsuarioLogado();
        if (!ativo) return;

        const chave = `${CHAVE_RASCUNHO}:${eu.userId}`;
        const salvo = lerRascunho(chave);
        if (salvo) setDados(salvo);
        setChaveRascunho(chave);
      } catch {
        return;
      }
    }

    void carregarRascunho();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (chaveRascunho) salvarRascunho(chaveRascunho, dados);
  }, [chaveRascunho, dados]);

  function alterar<K extends keyof DadosVeiculo>(
    campo: K,
    valor: DadosVeiculo[K]
  ) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    setEtapaConcluida(false);
  }

  const valorNumerico = lerValor(dados.valorTabela);

  const requisitos = useMemo(() => {
    const motor = lerMotor(dados.motorizacao);

    function estado(preenchido: boolean, atendido: boolean): EstadoRequisito {
      if (!preenchido) return 'pendente';
      return atendido ? 'atendido' : 'nao-atendido';
    }

    return [
      { texto: 'Zero quilômetro', estado: 'atendido' as EstadoRequisito },
      {
        texto: 'Fabricado ou montado no Brasil',
        estado: estado(dados.fabricadoBrasil !== '', dados.fabricadoBrasil === 'sim'),
      },
      {
        texto: 'Motor até 2.0 (1.0 turbo)',
        estado: estado(Number.isFinite(motor), motor <= 2),
      },
      {
        texto: 'Pelo menos 4 portas',
        estado: estado(
          dados.portas !== '',
          dados.portas === '4 portas' || dados.portas === '5 portas'
        ),
      },
      {
        texto: 'Flex, renovável, híbrido ou elétrico',
        estado: 'atendido' as EstadoRequisito,
      },
      {
        texto: 'Valor até R$ 200 mil',
        estado: estado(valorNumerico > 0, valorNumerico <= TETO_VALOR),
      },
    ];
  }, [dados.fabricadoBrasil, dados.motorizacao, dados.portas, valorNumerico]);

  const totalRequisitos = requisitos.filter((item) => item.estado === 'atendido').length;
  const percentual = Math.round((totalRequisitos / requisitos.length) * 100);

  const camposObrigatoriosOk =
    Boolean(dados.marca) &&
    Boolean(dados.modelo.trim()) &&
    Boolean(dados.anoModelo) &&
    valorNumerico > 0;

  const podeConcluir = totalRequisitos === requisitos.length && camposObrigatoriosOk;

  const economia = useMemo(() => {
    const aliquotaIpi = IPI_POR_MOTOR[dados.motorizacao];
    if (!valorNumerico || aliquotaIpi === undefined || valorNumerico > TETO_VALOR) {
      return null;
    }
    const taxa = aliquotaIpi / 100;
    const ipi = (valorNumerico * taxa) / (1 + taxa);
    const icms = valorNumerico * (ICMS_PADRAO / 100);
    return { total: ipi + icms, aliquotaIpi };
  }, [dados.motorizacao, valorNumerico]);

  function receberProposta(arquivo?: File) {
    if (!arquivo) return;

    const nome = arquivo.name.toLowerCase();
    if (!EXTENSOES_ACEITAS.some((extensao) => nome.endsWith(extensao))) {
      setErroProposta('Formato não aceito. Envie um PDF, JPG ou PNG.');
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      setErroProposta('Arquivo acima do limite de 10 MB.');
      return;
    }

    setErroProposta('');
    setProposta(arquivo);
  }

  function selecionarProposta(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = '';
    receberProposta(arquivo);
  }

  function verProposta() {
    if (!proposta) return;
    const url = URL.createObjectURL(proposta);
    window.open(url, '_blank', 'noopener');
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  function concluirEtapa() {
    if (!podeConcluir) return;

    if (chaveRascunho) salvarRascunho(chaveRascunho, dados);
    setEtapaConcluida(true);
    (aoConcluir ?? voltarTrilha)();
  }

  const mensagemConcluir = etapaConcluida
    ? 'Dados do veículo salvos neste navegador.'
    : !camposObrigatoriosOk
      ? 'Preencha os dados do veículo.'
      : !podeConcluir
        ? 'Confira os requisitos do veículo.'
        : 'Você pode trocar de carro depois, antes da revisão.';

  return (
    <PainelLayout
      aoSair={aoSair}
      aoNavegar={aoNavegar}
      itemAtivo="processo"
      caminho={['Meu processo', `Etapa ${numeroEtapa} · Dados do veículo`]}
    >
      <div className="etapa5-layout">
        <div className="etapa5-conteudo">
          <section className="etapa5-principal">
            <button type="button" className="etapa5-voltar" onClick={voltarTrilha}>
              <IconeSeta />
              Voltar para a trilha
            </button>

            <div
              className="etapa5-progresso-etapas"
              role="progressbar"
              aria-label="Etapas do processo"
              aria-valuenow={numeroEtapa}
              aria-valuemin={1}
              aria-valuemax={totalEtapas}
            >
              {Array.from({ length: totalEtapas }).map((_, index) => (
                <div
                  key={index}
                  className={`etapa5-progresso-item${index < numeroEtapa ? ' concluido' : ''}`}
                />
              ))}
            </div>

            <span className="etapa5-indicador">
              ETAPA {numeroEtapa} DE {totalEtapas}
            </span>

            <h1>
              Dados do <span>veículo</span>
            </h1>

            <p className="etapa5-subtitulo">
              Preencha os dados do carro que você pretende comprar. Conferimos
              os requisitos enquanto você digita.
            </p>

            <div className="etapa5-progresso-interno">
              <strong>{totalRequisitos} de {requisitos.length} requisitos atendidos</strong>

              <div
                className="etapa5-barra"
                role="progressbar"
                aria-valuenow={percentual}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div style={{ width: `${percentual}%` }} />
              </div>

              <span>{percentual}%</span>
            </div>

            <section className="etapa5-card">
              <div className="etapa5-card-cabecalho">
                <h2>Sobre o veículo</h2>
                <span
                  className={`etapa5-status ${podeConcluir ? 'status-completo' : 'status-preenchendo'}`}
                >
                  {podeConcluir ? 'Completo' : 'Preenchendo'}
                </span>
              </div>

              <div className="etapa5-form-grid">
                <div className="etapa5-campo">
                  <label htmlFor="etapa5-marca">Marca</label>
                  <select
                    id="etapa5-marca"
                    value={dados.marca}
                    onChange={(e) => alterar('marca', e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {MARCAS.map((marca) => (
                      <option key={marca}>{marca}</option>
                    ))}
                  </select>
                </div>

                <div className="etapa5-campo">
                  <label htmlFor="etapa5-modelo">Modelo e versão</label>
                  <input
                    id="etapa5-modelo"
                    value={dados.modelo}
                    maxLength={120}
                    onChange={(e) => alterar('modelo', e.target.value)}
                    placeholder="Ex.: Nivus Comfortline 200 TSI"
                  />
                </div>

                <div className="etapa5-campo">
                  <label htmlFor="etapa5-ano">Ano / modelo</label>
                  <select
                    id="etapa5-ano"
                    value={dados.anoModelo}
                    onChange={(e) => alterar('anoModelo', e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {ANOS_MODELO.map((ano) => (
                      <option key={ano}>{ano}</option>
                    ))}
                  </select>
                </div>

                <div className="etapa5-campo">
                  <label htmlFor="etapa5-motor">Motorização</label>
                  <select
                    id="etapa5-motor"
                    value={dados.motorizacao}
                    onChange={(e) => alterar('motorizacao', e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {MOTORIZACOES.map((motor) => (
                      <option key={motor}>{motor}</option>
                    ))}
                  </select>
                </div>

                <div className="etapa5-campo">
                  <label htmlFor="etapa5-portas">Número de portas</label>
                  <select
                    id="etapa5-portas"
                    value={dados.portas}
                    onChange={(e) => alterar('portas', e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {PORTAS.map((porta) => (
                      <option key={porta}>{porta}</option>
                    ))}
                  </select>
                </div>

                <fieldset className="etapa5-campo etapa5-campo-opcoes">
                  <legend>Fabricado ou montado no Brasil?</legend>

                  <div className="etapa5-opcoes">
                    {OPCOES_SIM_NAO.map((valor) => (
                      <button
                        type="button"
                        key={valor}
                        className={dados.fabricadoBrasil === valor ? 'selecionado' : ''}
                        aria-pressed={dados.fabricadoBrasil === valor}
                        onClick={() => alterar('fabricadoBrasil', valor)}
                      >
                        {ROTULO_OPCAO[valor]}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="etapa5-campo">
                  <label htmlFor="etapa5-valor">Valor de tabela</label>
                  <input
                    id="etapa5-valor"
                    inputMode="numeric"
                    value={dados.valorTabela}
                    onChange={(e) => alterar('valorTabela', formatarMoeda(e.target.value))}
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="etapa5-campo etapa5-campo-opcional">
                  <label htmlFor="etapa5-concessionaria">Concessionária (opcional)</label>
                  <input
                    id="etapa5-concessionaria"
                    value={dados.concessionaria}
                    maxLength={120}
                    onChange={(e) => alterar('concessionaria', e.target.value)}
                    placeholder="Nome e cidade"
                  />
                </div>
              </div>
            </section>

            <section className="etapa5-card">
              <div className="etapa5-card-cabecalho">
                <div>
                  <h2>Proposta da concessionária</h2>
                  <p>
                    Se já tiver, envie o orçamento. Ajuda a conferir o valor e a
                    versão.
                  </p>
                </div>

                <span className="etapa5-status">Opcional</span>
              </div>

              <div className="etapa5-upload-bloco">
                <input
                  ref={inputProposta}
                  id="etapa5-proposta"
                  className="etapa5-input-oculto"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={selecionarProposta}
                />

                {proposta ? (
                  <div className="etapa5-arquivo">
                    <IconeCheckCirculo />
                    <span className="etapa5-arquivo-nome">
                      {proposta.name} · {formatarTamanho(proposta.size)}
                    </span>
                    <div className="etapa5-arquivo-acoes">
                      <button type="button" onClick={verProposta}>
                        Ver
                      </button>
                      <button type="button" onClick={() => inputProposta.current?.click()}>
                        Substituir
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="etapa5-proposta"
                    className={`etapa5-upload${arrastando ? ' arrastando' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setArrastando(true);
                    }}
                    onDragLeave={() => setArrastando(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setArrastando(false);
                      receberProposta(e.dataTransfer.files?.[0]);
                    }}
                  >
                    <IconeUpload />
                    <span>
                      Arraste o arquivo aqui ou <strong>selecione do computador</strong>
                    </span>
                  </label>
                )}
              </div>

              {erroProposta && (
                <p className="etapa5-erro" role="alert">
                  {erroProposta}
                </p>
              )}
            </section>
          </section>

          <aside className="etapa5-lateral">
            <section className="etapa5-requisitos">
              <h3>Requisitos do veículo</h3>

              <ul>
                {requisitos.map((item) => (
                  <li key={item.texto} className={item.estado}>
                    <span aria-hidden="true">
                      {item.estado === 'atendido' ? (
                        <IconeCheckRequisito />
                      ) : item.estado === 'nao-atendido' ? (
                        '!'
                      ) : (
                        '•'
                      )}
                    </span>

                    {item.texto}
                  </li>
                ))}
              </ul>

              <div
                className={`etapa5-requisitos-resumo${percentual === 100 ? ' completo' : ''}`}
              >
                {percentual === 100
                  ? 'Este veículo atende a todos os requisitos.'
                  : requisitos.some((item) => item.estado === 'nao-atendido')
                    ? 'Revise os dados destacados para atender aos requisitos.'
                    : 'Preencha os dados para conferir os requisitos.'}
              </div>
            </section>

            <section className="etapa5-economia">
              <h3>Economia estimada</h3>

              {economia ? (
                <>
                  <div className="etapa5-valor-economia">
                    {formatarReais(economia.total)} <small>aprox.</small>
                  </div>
                  <p>
                    Com IPI de {economia.aliquotaIpi.toString().replace('.', ',')}% e ICMS de {ICMS_PADRAO}%.
                    Estimativa; confirme na calculadora.
                  </p>
                </>
              ) : (
                <p>
                  Informe motorização e valor (até R$ 200 mil) para ver uma estimativa.
                </p>
              )}

              {abrirCalculadora && (
                <button type="button" onClick={abrirCalculadora}>
                  Abrir na calculadora
                </button>
              )}
            </section>

            <section className="etapa5-concluir-card">
              <button type="button" disabled={!podeConcluir} onClick={concluirEtapa}>
                {etapaConcluida ? (
                  'Etapa concluída'
                ) : (
                  <>
                    Concluir etapa {numeroEtapa}
                    <IconeSetaDireita />
                  </>
                )}
              </button>

              <span>{mensagemConcluir}</span>
            </section>
          </aside>
        </div>
      </div>
    </PainelLayout>
  );
}