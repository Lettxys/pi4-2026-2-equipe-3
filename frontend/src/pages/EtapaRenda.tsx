import { useEffect, useState } from 'react';

import PainelLayout from '../components/PainelLayout';
import type { DestinoMenu } from '../components/PainelLayout';
import {
  buscarChecklistDocumentos,
  buscarProgressoProcesso,
  buscarUsuarioLogado,
  temToken,
} from '../services/api';

import './EtapaRenda.css';

interface EtapaRendaProps {
  aoSair: () => void | Promise<void>;
  voltarTrilha: () => void;
  aoConcluir?: () => void;
  aoNavegar?: (destino: DestinoMenu) => void;
}

const NUMERO_ETAPA = 4;
const TOTAL_ETAPAS = 6;

const NIVEIS_GOV = [
  { valor: 'bronze', texto: 'Bronze' },
  { valor: 'prata', texto: 'Prata' },
  { valor: 'ouro', texto: 'Ouro' },
  { valor: 'nao-tem', texto: 'Não tenho conta' },
] as const;

type NivelGov = (typeof NIVEIS_GOV)[number]['valor'];

export default function EtapaRenda({
  aoSair,
  voltarTrilha,
  aoConcluir,
  aoNavegar,
}: EtapaRendaProps) {
  const [financiamento, setFinanciamento] = useState<'sim' | 'avista'>('avista');
  const [ano, setAno] = useState('2025');
  const [nivelGov, setNivelGov] = useState<NivelGov>('prata');
  const [confirmouDados, setConfirmouDados] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [etapaConcluida, setEtapaConcluida] = useState(false);
  // Lido do backend: se a declaração já consta como enviada no checklist,
  // a etapa já nasce resolvida (sem novo upload — backend não tem endpoint).
  const [declaracaoBackend, setDeclaracaoBackend] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(NUMERO_ETAPA);

  useEffect(() => {
    let ativo = true;

    async function carregarDoBackend() {
      if (!temToken()) return;
      try {
        const eu = await buscarUsuarioLogado();
        if (!eu.activeProcessId) return;
        const [prog, checklist] = await Promise.all([
          buscarProgressoProcesso(eu.activeProcessId),
          buscarChecklistDocumentos(eu.activeProcessId).catch(() => null),
        ]);
        if (!ativo) return;
        setEtapaAtual(prog.currentStep || NUMERO_ETAPA);
        // FINANCIAL_DECLARATION cai nesta etapa; IPI/ICMS_AUTHORIZATION também
        // são mapeadas para "Renda e acesso gov.br" no Overview.
        const enviadas = checklist?.filter((item) => item.isUploaded) ?? [];
        setDeclaracaoBackend(enviadas.length > 0);
      } catch {
        // Fallback silencioso: a tela funciona localmente, como a Etapa 1.
      }
    }

    void carregarDoBackend();
    return () => {
      ativo = false;
    };
  }, []);

  const rendaOk = financiamento === 'sim' || Boolean(arquivo) || declaracaoBackend;
  const govOk = nivelGov !== 'nao-tem' && confirmouDados;
  const podeConcluir = rendaOk && govOk;

  const concluidas = Number(rendaOk) + Number(govOk);
  const porcentagem = concluidas * 50;

  function selecionarArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const selecionado = event.target.files?.[0];
    if (selecionado) {
      setArquivo(selecionado);
      setEtapaConcluida(false);
    }
    event.target.value = '';
  }

  function concluirEtapa() {
    if (!podeConcluir) return;
    setEtapaConcluida(true);
    // Sem endpoint de "concluir etapa" no backend: volta para a trilha,
    // mesmo comportamento da Etapa 1 hoje.
    (aoConcluir ?? voltarTrilha)();
  }

  const mensagemPendente =
    !rendaOk
      ? 'Envie a declaração do Imposto de Renda'
      : nivelGov === 'nao-tem'
        ? 'Crie sua conta gov.br para continuar'
        : !confirmouDados
          ? 'Confirme seu acesso ao gov.br'
          : 'Tudo pronto para continuar';

  return (
    <PainelLayout
      aoSair={aoSair}
      aoNavegar={aoNavegar}
      itemAtivo="processo"
      caminho={['Meu processo', 'Etapa 4 · Renda e gov.br']}
    >
      <div className="etapaRenda-layout">
        <div className="etapaRenda-conteudo">
          <div className="etapaRenda-principal">
            <button type="button" className="etapaRenda-voltar" onClick={voltarTrilha}>
              <span aria-hidden="true">←</span> Voltar para a trilha
            </button>

            <div className="etapaRenda-progresso-etapas" role="progressbar" aria-label="Etapas do processo" aria-valuenow={etapaAtual} aria-valuemin={1} aria-valuemax={TOTAL_ETAPAS}>
              {Array.from({ length: TOTAL_ETAPAS }).map((_, index) => (
                <div
                  key={index}
                  className={`etapaRenda-progresso-item${index < etapaAtual ? ' concluido' : ''}`}
                />
              ))}
            </div>

            <span className="etapaRenda-indicador">ETAPA {NUMERO_ETAPA} DE {TOTAL_ETAPAS}</span>

            <h1>
              Renda e <span>acesso gov.br</span>
            </h1>

            <p className="etapaRenda-subtitulo">
              Aqui algumas respostas disparam documentos. Responda primeiro
              e mostraremos só o que você precisa.
            </p>

            <div className="etapaRenda-progresso-interno">
              <strong>{concluidas} de 2 concluídas</strong>
              <div className="etapaRenda-barra" role="progressbar" aria-valuenow={porcentagem} aria-valuemin={0} aria-valuemax={100}>
                <div style={{ width: `${porcentagem}%` }} />
              </div>
              <span>{porcentagem}%</span>
            </div>

            <section className="etapaRenda-card">
              <div className="etapaRenda-card-cabecalho">
                <div>
                  <h2>Declaração do Imposto de Renda</h2>
                  <p>
                    A Receita confere se a renda é compatível com o valor
                    do carro. Se você for financiar, a declaração é dispensada.
                  </p>
                </div>
                <span className={`etapaRenda-status${rendaOk ? ' status-ok' : ''}`}>
                  {rendaOk ? 'Enviado' : 'Pendente'}
                </span>
              </div>

              <div className="etapaRenda-pergunta">
                <strong>Você vai financiar o veículo?</strong>
                <div className="etapaRenda-opcoes">
                  <button
                    type="button"
                    className={financiamento === 'sim' ? 'selecionado' : ''}
                    onClick={() => {
                      setFinanciamento('sim');
                      setEtapaConcluida(false);
                    }}
                  >
                    Sim, vou financiar{financiamento === 'sim' && <svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.879883 4.08L4.47988 7.68001L11.2799 0.880005" stroke-width="1.76" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
</svg>}
                  </button>
                  <button
                    type="button"
                    className={financiamento === 'avista' ? 'selecionado' : ''}
                    onClick={() => {
                      setFinanciamento('avista');
                      setEtapaConcluida(false);
                    }}
                  >
                    Não, vou pagar à vista{financiamento === 'avista' && <svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.879883 4.08L4.47988 7.68001L11.2799 0.880005" stroke-width="1.76" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
</svg>}
                  </button>
                </div>
              </div>

              {financiamento === 'avista' ? (
                <div className="etapaRenda-upload-linha">
                  <label className="etapaRenda-upload">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={selecionarArquivo}
                    />
                    <span className="etapaRenda-upload-icone" aria-hidden="true"><svg width="15" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.4751 15.225V1.72498M5.4751 6.97498L11.4751 0.974976L17.4751 6.97498M0.975098 15.225V21.225H21.9751V15.225" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
</svg>
</span>
                    <span>
                      {arquivo ? (
                        <>
                          Arquivo selecionado: <strong> {arquivo.name}</strong>
                        </>
                      ) : declaracaoBackend ? (
                        <>
                          <strong>Declaração já enviada</strong> (consta no checklist).
                          Selecione um novo arquivo para substituir.
                        </>
                      ) : (
                        <>
                          Selecione a declaração do computador
                          <strong> (PDF, JPG ou PNG)</strong>
                        </>
                      )}
                    </span>
                  </label>
                  {arquivo && (
                    <button type="button" onClick={() => setArquivo(null)}>
                      Remover
                    </button>
                  )}
                  <div className="etapaRenda-ano">
                    <label htmlFor="ano-calendario">Ano-calendário</label>
                    <select
                      id="ano-calendario"
                      value={ano}
                      onChange={(event) => setAno(event.target.value)}
                    >
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="etapaRenda-aviso">
                  <svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.879883 4.08L4.47988 7.68001L11.2799 0.880005" stroke-width="1.76" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
</svg> Como você vai financiar o veículo, a declaração
                  de Imposto de Renda não é necessária nesta etapa.
                </div>
              )}
            </section>

            <section className="etapaRenda-card etapaRenda-card-gov">
              <div className="etapaRenda-card-cabecalho">
                <div>
                  <h2>Conta gov.br</h2>
                  <p>
                    Na próxima etapa você vai usar o gov.br para entrar
                    no SISEN e enviar o pedido.
                  </p>
                </div>
                <span className={`etapaRenda-status${govOk ? ' status-ok' : ''}`}>
                  {govOk ?  (<><svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.879883 4.08L4.47988 7.68001L11.2799 0.880005" stroke-width="1.76" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
</svg>Confirmado</>) : 'Pendente'}
                </span>
              </div>

              <div className="etapaRenda-pergunta">
                <strong>Qual é o nível da sua conta?</strong>
                <div className="etapaRenda-opcoes etapaRenda-opcoes-gov">
                  {NIVEIS_GOV.map((opcao) => (
                    <button
                      type="button"
                      key={opcao.valor}
                      className={nivelGov === opcao.valor ? 'selecionado' : ''}
                      onClick={() => {
                        setNivelGov(opcao.valor);
                        setEtapaConcluida(false);
                      }}
                    >
                      {opcao.texto}{nivelGov === opcao.valor && <svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.879883 4.08L4.47988 7.68001L11.2799 0.880005" stroke-width="1.76" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
</svg>}
                    </button>
                  ))}
                </div>
              </div>

              {nivelGov === 'nao-tem' ? (
                <div className="etapaRenda-aviso">
                  Você precisa criar uma conta gov.br para continuar.
                  <a
                    href="https://www.gov.br/governodigital/pt-br/identidade/conta-gov-br"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Criar conta gov.br
                  </a>
                </div>
              ) : (
                <>
                  <div className="etapaRenda-dica">
                   Bronze já basta para o SISEN. Ouro agiliza algumas verificações, mas não é obrigatório.
                  </div>
                  <label className="etapaRenda-checkbox">
                    <input
                      type="checkbox"
                      checked={confirmouDados}
                      onChange={(event) => {
                        setConfirmouDados(event.target.checked);
                        setEtapaConcluida(false);
                      }}
                    />
                    <span>Confirmo que consigo entrar no gov.br com o meu CPF.</span>
                  </label>
                </>
              )}
            </section>
          </div>

          <aside className="etapaRenda-lateral">
            <section className="etapaRenda-info-card">
              <h3>Por que essa etapa?</h3>
              <p>
                <svg width="10" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 10.5L9 13.5L14.5 7.5M1 10C1 5.0293 5.0293 1 10 1C14.9707 1 19 5.0293 19 10C19 14.9707 14.9707 19 10 19C5.0293 19 1 14.9707 1 10Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#1F9D63"/>
</svg>A Receita verifica se a renda e o patrimônio são compatíveis com o valor do veículo.
              </p>
              <p><svg width="10" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 10.5L9 13.5L14.5 7.5M1 10C1 5.0293 5.0293 1 10 1C14.9707 1 19 5.0293 19 10C19 14.9707 14.9707 19 10 19C5.0293 19 1 14.9707 1 10Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#1F9D63"/>
</svg>O pedido é feito no SISEN, que usa seu
                acesso gov.br.
              </p>
            </section>

            <section className="etapaRenda-ajuda-card">
              <h3>Não tem conta gov.br?</h3>
              <p>
                Marque "Não tenho conta" e mostraremos o passo
                a passo para criar a sua pelo app ou site gov.br.
              </p>
            </section>

            <section className="etapaRenda-concluir-card">
              <h3>Concluir etapa</h3>
              <button
  type="button"
  disabled={!podeConcluir}
  onClick={concluirEtapa}
>
  {etapaConcluida ?  (
    <>
      <svg className="etapaRenda-decoracao" width="158" height="15" viewBox="0 0 158 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 8H1V20H17V8H14M4 8H14M4 8V4C4 0 14 0 14 4V8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#7D8FA6"/>
<path d="M34.092 17.18C33.18 17.18 32.334 17.018 31.554 16.694C30.786 16.358 30.114 15.896 29.538 15.308C28.962 14.708 28.518 14.018 28.206 13.238C27.894 12.446 27.738 11.6 27.738 10.7C27.738 9.8 27.894 8.96 28.206 8.18C28.518 7.388 28.962 6.698 29.538 6.11C30.114 5.522 30.786 5.06 31.554 4.724C32.334 4.388 33.18 4.22 34.092 4.22C35.112 4.22 35.994 4.388 36.738 4.724C37.482 5.06 38.142 5.516 38.718 6.092L37.314 7.496C36.942 7.088 36.486 6.77 35.946 6.542C35.418 6.314 34.8 6.2 34.092 6.2C33.468 6.2 32.898 6.308 32.382 6.524C31.866 6.74 31.416 7.052 31.032 7.46C30.66 7.856 30.372 8.33 30.168 8.882C29.964 9.434 29.862 10.04 29.862 10.7C29.862 11.36 29.964 11.966 30.168 12.518C30.372 13.07 30.66 13.55 31.032 13.958C31.416 14.354 31.866 14.66 32.382 14.876C32.898 15.092 33.468 15.2 34.092 15.2C34.86 15.2 35.508 15.086 36.036 14.858C36.576 14.618 37.032 14.294 37.404 13.886L38.808 15.29C38.232 15.878 37.554 16.34 36.774 16.676C35.994 17.012 35.1 17.18 34.092 17.18ZM44.0814 17.18C43.2414 17.18 42.4794 16.982 41.7954 16.586C41.1114 16.178 40.5654 15.632 40.1574 14.948C39.7614 14.264 39.5634 13.502 39.5634 12.662C39.5634 11.822 39.7614 11.066 40.1574 10.394C40.5654 9.722 41.1114 9.188 41.7954 8.792C42.4794 8.384 43.2414 8.18 44.0814 8.18C44.9334 8.18 45.7014 8.378 46.3854 8.774C47.0694 9.17 47.6094 9.71 48.0054 10.394C48.4134 11.066 48.6174 11.822 48.6174 12.662C48.6174 13.502 48.4134 14.264 48.0054 14.948C47.6094 15.632 47.0694 16.178 46.3854 16.586C45.7014 16.982 44.9334 17.18 44.0814 17.18ZM44.0814 15.272C44.5734 15.272 45.0054 15.164 45.3774 14.948C45.7614 14.72 46.0554 14.408 46.2594 14.012C46.4754 13.616 46.5834 13.166 46.5834 12.662C46.5834 12.158 46.4754 11.714 46.2594 11.33C46.0434 10.946 45.7494 10.646 45.3774 10.43C45.0054 10.202 44.5734 10.088 44.0814 10.088C43.6014 10.088 43.1694 10.202 42.7854 10.43C42.4134 10.646 42.1194 10.946 41.9034 11.33C41.6994 11.714 41.5974 12.158 41.5974 12.662C41.5974 13.166 41.6994 13.616 41.9034 14.012C42.1194 14.408 42.4134 14.72 42.7854 14.948C43.1694 15.164 43.6014 15.272 44.0814 15.272ZM56.186 17V12.014C56.186 11.438 56 10.964 55.628 10.592C55.268 10.22 54.8 10.034 54.224 10.034C53.84 10.034 53.498 10.118 53.198 10.286C52.898 10.454 52.664 10.688 52.496 10.988C52.328 11.288 52.244 11.63 52.244 12.014L51.47 11.582C51.47 10.922 51.614 10.34 51.902 9.836C52.19 9.32 52.586 8.918 53.09 8.63C53.606 8.33 54.182 8.18 54.818 8.18C55.466 8.18 56.042 8.348 56.546 8.684C57.05 9.008 57.446 9.434 57.734 9.962C58.022 10.478 58.166 11.018 58.166 11.582V17H56.186ZM50.264 17V8.36H52.244V17H50.264ZM64.1561 17.18C63.3041 17.18 62.5301 16.982 61.8341 16.586C61.1501 16.19 60.6101 15.65 60.2141 14.966C59.8181 14.282 59.6201 13.52 59.6201 12.68C59.6201 11.828 59.8181 11.066 60.2141 10.394C60.6101 9.71 61.1501 9.17 61.8341 8.774C62.5301 8.378 63.3041 8.18 64.1561 8.18C64.8281 8.18 65.4521 8.312 66.0281 8.576C66.6161 8.828 67.1141 9.194 67.5221 9.674L66.2261 10.988C65.9741 10.688 65.6681 10.466 65.3081 10.322C64.9601 10.166 64.5761 10.088 64.1561 10.088C63.6641 10.088 63.2261 10.202 62.8421 10.43C62.4701 10.646 62.1761 10.946 61.9601 11.33C61.7561 11.714 61.6541 12.164 61.6541 12.68C61.6541 13.184 61.7561 13.634 61.9601 14.03C62.1761 14.414 62.4701 14.72 62.8421 14.948C63.2261 15.164 63.6641 15.272 64.1561 15.272C64.5761 15.272 64.9601 15.2 65.3081 15.056C65.6681 14.9 65.9741 14.672 66.2261 14.372L67.5221 15.686C67.1141 16.166 66.6161 16.538 66.0281 16.802C65.4521 17.054 64.8281 17.18 64.1561 17.18ZM68.9496 17V4.04H70.9296V17H68.9496ZM76.6792 17.18C75.9472 17.18 75.2932 17.018 74.7172 16.694C74.1532 16.37 73.7092 15.926 73.3852 15.362C73.0732 14.786 72.9172 14.126 72.9172 13.382V8.36H74.8972V13.292C74.8972 13.712 74.9632 14.072 75.0952 14.372C75.2392 14.66 75.4432 14.882 75.7072 15.038C75.9832 15.194 76.3072 15.272 76.6792 15.272C77.2552 15.272 77.6932 15.104 77.9932 14.768C78.3052 14.42 78.4612 13.928 78.4612 13.292V8.36H80.4412V13.382C80.4412 14.138 80.2792 14.804 79.9552 15.38C79.6432 15.944 79.2052 16.388 78.6412 16.712C78.0772 17.024 77.4232 17.18 76.6792 17.18ZM82.45 17V8.36H84.43V17H82.45ZM83.44 6.776C83.104 6.776 82.822 6.662 82.594 6.434C82.378 6.206 82.27 5.924 82.27 5.588C82.27 5.252 82.378 4.97 82.594 4.742C82.822 4.514 83.104 4.4 83.44 4.4C83.788 4.4 84.07 4.514 84.286 4.742C84.502 4.97 84.61 5.252 84.61 5.588C84.61 5.924 84.502 6.206 84.286 6.434C84.07 6.662 83.788 6.776 83.44 6.776ZM86.6507 17V8.36H88.6307V17H86.6507ZM88.6307 12.194L87.9467 11.852C87.9467 10.76 88.1867 9.878 88.6667 9.206C89.1587 8.522 89.8967 8.18 90.8807 8.18C91.3127 8.18 91.7027 8.258 92.0507 8.414C92.3987 8.57 92.7227 8.822 93.0227 9.17L91.7267 10.502C91.5707 10.334 91.3967 10.214 91.2047 10.142C91.0127 10.07 90.7907 10.034 90.5387 10.034C89.9867 10.034 89.5307 10.208 89.1707 10.556C88.8107 10.904 88.6307 11.45 88.6307 12.194ZM101.915 17.18C101.051 17.18 100.271 16.988 99.5747 16.604C98.8907 16.208 98.3447 15.668 97.9367 14.984C97.5407 14.3 97.3427 13.532 97.3427 12.68C97.3427 11.828 97.5407 11.066 97.9367 10.394C98.3327 9.71 98.8667 9.17 99.5387 8.774C100.223 8.378 100.979 8.18 101.807 8.18C102.611 8.18 103.319 8.366 103.931 8.738C104.555 9.11 105.041 9.62 105.389 10.268C105.749 10.916 105.929 11.654 105.929 12.482C105.929 12.626 105.917 12.776 105.893 12.932C105.881 13.076 105.857 13.238 105.821 13.418H98.7287V11.798H104.795L104.057 12.446C104.033 11.918 103.931 11.474 103.751 11.114C103.571 10.754 103.313 10.478 102.977 10.286C102.653 10.094 102.251 9.998 101.771 9.998C101.267 9.998 100.829 10.106 100.457 10.322C100.085 10.538 99.7967 10.844 99.5927 11.24C99.3887 11.624 99.2867 12.086 99.2867 12.626C99.2867 13.166 99.3947 13.64 99.6107 14.048C99.8267 14.456 100.133 14.774 100.529 15.002C100.925 15.218 101.381 15.326 101.897 15.326C102.341 15.326 102.749 15.248 103.121 15.092C103.505 14.936 103.829 14.708 104.093 14.408L105.353 15.686C104.933 16.178 104.423 16.55 103.823 16.802C103.223 17.054 102.587 17.18 101.915 17.18ZM108.601 17V4.76H110.581V17H108.601ZM106.531 10.16V8.36H112.651V10.16H106.531ZM117.462 17.18C116.682 17.18 115.974 16.982 115.338 16.586C114.714 16.19 114.216 15.656 113.844 14.984C113.484 14.3 113.304 13.538 113.304 12.698C113.304 11.846 113.484 11.084 113.844 10.412C114.216 9.728 114.714 9.188 115.338 8.792C115.974 8.384 116.682 8.18 117.462 8.18C118.122 8.18 118.704 8.324 119.208 8.612C119.724 8.888 120.132 9.272 120.432 9.764C120.732 10.256 120.882 10.814 120.882 11.438V13.922C120.882 14.546 120.732 15.104 120.432 15.596C120.144 16.088 119.742 16.478 119.226 16.766C118.71 17.042 118.122 17.18 117.462 17.18ZM117.786 15.308C118.518 15.308 119.106 15.062 119.55 14.57C120.006 14.078 120.234 13.448 120.234 12.68C120.234 12.164 120.132 11.708 119.928 11.312C119.724 10.916 119.436 10.61 119.064 10.394C118.704 10.166 118.278 10.052 117.786 10.052C117.306 10.052 116.88 10.166 116.508 10.394C116.148 10.61 115.86 10.916 115.644 11.312C115.44 11.708 115.338 12.164 115.338 12.68C115.338 13.196 115.44 13.652 115.644 14.048C115.86 14.444 116.148 14.756 116.508 14.984C116.88 15.2 117.306 15.308 117.786 15.308ZM120.108 17V14.678L120.45 12.572L120.108 10.484V8.36H122.088V17H120.108ZM128.911 17.18C128.252 17.18 127.663 17.042 127.147 16.766C126.632 16.478 126.224 16.088 125.924 15.596C125.635 15.104 125.492 14.546 125.492 13.922V11.438C125.492 10.814 125.642 10.256 125.941 9.764C126.242 9.272 126.649 8.888 127.165 8.612C127.682 8.324 128.263 8.18 128.911 8.18C129.691 8.18 130.394 8.384 131.018 8.792C131.654 9.188 132.151 9.728 132.511 10.412C132.883 11.084 133.07 11.846 133.07 12.698C133.07 13.538 132.883 14.3 132.511 14.984C132.151 15.656 131.654 16.19 131.018 16.586C130.394 16.982 129.691 17.18 128.911 17.18ZM124.285 20.6V8.36H126.266V10.682L125.924 12.788L126.266 14.876V20.6H124.285ZM128.588 15.308C129.067 15.308 129.488 15.2 129.848 14.984C130.219 14.756 130.507 14.444 130.712 14.048C130.927 13.652 131.035 13.196 131.035 12.68C131.035 12.164 130.927 11.708 130.712 11.312C130.507 10.916 130.219 10.61 129.848 10.394C129.488 10.166 129.067 10.052 128.588 10.052C128.107 10.052 127.682 10.166 127.31 10.394C126.938 10.61 126.649 10.916 126.446 11.312C126.242 11.708 126.14 12.164 126.14 12.68C126.14 13.196 126.242 13.652 126.446 14.048C126.649 14.444 126.938 14.756 127.31 14.984C127.682 15.2 128.107 15.308 128.588 15.308ZM138.345 17.18C137.565 17.18 136.857 16.982 136.221 16.586C135.597 16.19 135.099 15.656 134.727 14.984C134.367 14.3 134.187 13.538 134.187 12.698C134.187 11.846 134.367 11.084 134.727 10.412C135.099 9.728 135.597 9.188 136.221 8.792C136.857 8.384 137.565 8.18 138.345 8.18C139.005 8.18 139.587 8.324 140.091 8.612C140.607 8.888 141.015 9.272 141.315 9.764C141.615 10.256 141.765 10.814 141.765 11.438V13.922C141.765 14.546 141.615 15.104 141.315 15.596C141.027 16.088 140.625 16.478 140.109 16.766C139.593 17.042 139.005 17.18 138.345 17.18ZM138.669 15.308C139.401 15.308 139.989 15.062 140.433 14.57C140.889 14.078 141.117 13.448 141.117 12.68C141.117 12.164 141.015 11.708 140.811 11.312C140.607 10.916 140.319 10.61 139.947 10.394C139.587 10.166 139.161 10.052 138.669 10.052C138.189 10.052 137.763 10.166 137.391 10.394C137.031 10.61 136.743 10.916 136.527 11.312C136.323 11.708 136.221 12.164 136.221 12.68C136.221 13.196 136.323 13.652 136.527 14.048C136.743 14.444 137.031 14.756 137.391 14.984C137.763 15.2 138.189 15.308 138.669 15.308ZM140.991 17V14.678L141.333 12.572L140.991 10.484V8.36H142.971V17H140.991ZM148.178 12.5L152.66 4.4H155L150.41 12.5H148.178ZM148.178 13.76V12.5L149.06 11.906H157.952V13.76H148.178ZM154.154 17V8.756H156.188V17H154.154Z" fill="#7D8FA6"/>
</svg>

    </>
  ):(<><svg width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.879883 4.08L4.47988 7.68001L11.2799 0.880005" stroke-width="1.76" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
</svg>
<span>Etapa concluída</span> </>
    
  ) }
</button>
              <span>{mensagemPendente}</span>
            </section>
          </aside>
        </div>
      </div>
    </PainelLayout>
  );
}
