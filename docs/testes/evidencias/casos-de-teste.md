# Casos de Teste

## Projeto
Sistema Facilitador de Isenção de Impostos para PcDs

## Responsável
Aurea Taissa Sá Lima — QA

---

# 📋 Suíte de Testes

| Código | Suíte | Descrição |
|---|---|---|
| ST-01 | Perfil e formulários | Seleção do perfil e apresentação dinâmica dos formulários |
| ST-02 | Gestão documental | Checklist, upload e validade de documentos |
| ST-03 | Progresso do processo | Salvamento, retomada e validação das etapas |
| ST-04 | Revisão e dossiê | Conferência final e geração do dossiê |
| ST-05 | Regras de negócio | Restrições legais de condutores, CNH, veículo, titularidade e laudos |

---

# CT-001 — Apresentar formulário dinâmico para PcD Condutor

| Campo | Informação |
|---|---|
| **Identificador** | CT-001 |
| **Versão** | 1 |
| **Suíte de teste** | ST-01 — Perfil e formulários |
| **Autor** | Aurea Taissa Sá Lima |
| **Requisito coberto** | RF01 — Fluxos Dinâmicos de Formulário |
| **Importância** | Alta |

### Resumo

Verifica se o sistema adapta os formulários e documentos exigidos ao perfil **PcD Condutor**, incluindo a exigência de CNH com restrição.

### Pré-condições

- Usuário cadastrado e autenticado, sem processo de isenção em andamento.
- Funcionalidade de início do processo disponível.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar a opção de iniciar processo de isenção. | O sistema apresenta a seleção do perfil do requerente. |
| 2 | Selecionar **PcD Condutor**. | O sistema identifica o perfil de condutor. |
| 3 | Selecionar um tipo de deficiência válido e confirmar que a solicitação se refere a veículo novo (0 km). | O sistema aceita os dados necessários para iniciar o processo. |
| 4 | Confirmar o início do processo. | O sistema registra o processo com o perfil **PcD Condutor**. |
| 5 | Acessar o formulário e o checklist de documentos do processo. | O sistema apresenta os campos e documentos específicos do perfil, incluindo a CNH com restrição. |
| 6 | Verificar a disponibilidade da indicação de condutores autorizados. | O sistema não disponibiliza essa funcionalidade para o perfil **PcD Condutor**. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | — |

---

# CT-002 — Exibir checklist e atualizar documento após upload

| Campo | Informação |
|---|---|
| **Identificador** | CT-002 |
| **Versão** | 1 |
| **Suíte de teste** | ST-02 — Gestão documental |
| **Autor** | Aurea Taissa Sá Lima |
| **Requisito coberto** | RF03 — Módulo de Checklist e Upload |
| **Importância** | Alta |

### Resumo

Verifica se o checklist apresenta os documentos exigidos e atualiza a situação de um item após o envio de arquivo válido.

### Pré-condições

- Usuário autenticado com processo iniciado.
- Comprovante de residência exigido e ainda não enviado.
- Arquivo de teste em PDF, com tamanho inferior a 10 MB, disponível.
- Data de emissão ou de validade válida disponível para o upload.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar o checklist de documentos. | O sistema apresenta os documentos exigidos para o perfil do usuário. |
| 2 | Localizar **Comprovante de Residência**. | O item aparece como pendente de envio. |
| 3 | Selecionar a opção de anexar documento. | O sistema permite selecionar arquivo e informar os dados necessários. |
| 4 | Selecionar o PDF de teste e informar uma data válida. | O sistema recebe os dados do arquivo e seus metadados. |
| 5 | Confirmar o upload. | O sistema armazena o documento e confirma o envio. |
| 6 | Consultar novamente o checklist. | O item deixa de aparecer como não enviado, e o sistema apresenta o status atualizado do documento. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | — |

---

# CT-003 — Apresentar orientação simplificada de etapa

| Campo | Informação |
|---|---|
| **Identificador** | CT-003 |
| **Versão** | 1 |
| **Suíte de teste** | ST-01 — Perfil e formulários |
| **Autor** | Aurea Taissa Sá Lima |
| **Requisito coberto** | RF04 — Tradução de Termos Complexos |
| **Importância** | Média |

### Resumo

Verifica se a orientação de uma etapa apresenta explicações em linguagem acessível para procedimentos burocráticos, conforme os dados disponibilizados pelo sistema.

### Pré-condições

- Usuário autenticado com processo iniciado.
- Etapa de orientação sobre obtenção do laudo médico disponível.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar a etapa de obtenção do laudo médico. | O sistema apresenta o título e as informações da etapa. |
| 2 | Consultar a orientação disponibilizada para a etapa. | O sistema apresenta explicação simplificada do procedimento. |
| 3 | Verificar as instruções da etapa. | O sistema apresenta ações orientativas, como agendar consulta e conferir a data de emissão do laudo. |
| 4 | Verificar a identificação do órgão responsável. | O sistema identifica a clínica ou o órgão relacionado à etapa. |
| 5 | Verificar a linguagem da explicação. | A orientação descreve o procedimento de forma compreensível, sem depender exclusivamente de jargões técnicos. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | — |

---

# CT-004 — Salvar e retomar processo com formulário incompleto

| Campo | Informação |
|---|---|
| **Identificador** | CT-004 |
| **Versão** | 1 |
| **Suíte de teste** | ST-03 — Progresso do processo |
| **Autor** | Aurea Taissa Sá Lima |
| **Requisito coberto** | RF07 — Salvamento de Progresso e Retomada de Sessão |
| **Importância** | Alta |

### Resumo

Verifica se o sistema preserva dados preenchidos parcialmente e permite retomar o processo após o encerramento da sessão.

### Pré-condições

- Usuário cadastrado e autenticado com processo iniciado.
- Etapa de formulário disponível para preenchimento parcial.
- Usuário conhece suas credenciais de acesso.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar uma etapa do formulário do processo. | O sistema apresenta os campos da etapa. |
| 2 | Preencher somente o campo **Modelo do veículo** com **Modelo Teste QA**. | O valor informado aparece no campo. |
| 3 | Salvar o progresso como rascunho, sem concluir a etapa. | O sistema confirma o salvamento mesmo com a etapa incompleta. |
| 4 | Encerrar a sessão. | O usuário deixa de ter acesso à sessão autenticada. |
| 5 | Realizar novo login com as mesmas credenciais. | O sistema autentica o usuário e permite recuperar seu processo em andamento. |
| 6 | Retomar a etapa anteriormente preenchida. | O sistema apresenta a etapa correspondente ao progresso salvo. |
| 7 | Verificar o campo **Modelo do veículo**. | O valor **Modelo Teste QA** permanece preenchido. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | — |

---

# CT-005 — Impedir avanço de etapa com campo obrigatório vazio

| Campo | Informação |
|---|---|
| **Identificador** | CT-005 |
| **Versão** | 1 |
| **Suíte de teste** | ST-03 — Progresso do processo |
| **Autor** | Aurea Taissa Sá Lima |
| **Requisito coberto** | RF08 — Validação de Etapas (Gatekeeper) |
| **Importância** | Alta |

### Resumo

Verifica se o sistema impede o avanço quando um campo obrigatório da etapa não foi preenchido.

### Pré-condições

- Usuário autenticado com processo iniciado.
- Etapa contendo o campo obrigatório **Modelo do veículo** disponível.
- Demais condições da etapa atendidas, para isolar a validação do campo.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar a etapa que solicita o modelo do veículo. | O sistema apresenta o campo identificado como obrigatório. |
| 2 | Deixar **Modelo do veículo** vazio. | O campo permanece sem valor. |
| 3 | Selecionar a opção de avançar para a próxima etapa. | O sistema executa a validação dos dados da etapa. |
| 4 | Verificar o resultado da validação. | O sistema informa que o campo obrigatório não foi preenchido. |
| 5 | Verificar a etapa atual. | O usuário permanece na etapa atual, sem avanço. |
| 6 | Preencher **Modelo do veículo** com **Modelo Teste QA** e validar novamente. | A pendência do campo é removida; se não houver outras pendências, o sistema permite avançar. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | — |

---

# CT-006 — Exibir orientação sequencial dos órgãos

| Campo | Informação |
|---|---|
| **Identificador** | CT-006 |
| **Versão** | 1 |
| **Suíte de teste** | ST-01 — Perfil e formulários |
| **Autor** | Aurea Taissa Sá Lima |
| **Requisito coberto** | RF05 — Orientação Multiórgãos |
| **Importância** | Alta |

### Resumo

Verifica se o sistema identifica os órgãos envolvidos e apresenta a sequência de orientações conforme o progresso do processo.

### Pré-condições

- Usuário autenticado com processo iniciado.
- Etapas referentes à Receita Federal concluídas e validadas em ambiente de teste.
- Etapa subsequente relacionada à SEFAZ disponível.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar a visualização de órgãos e etapas do processo. | O sistema apresenta os órgãos relacionados ao processo e seus respectivos status. |
| 2 | Verificar a situação da Receita Federal. | As etapas concluídas da Receita Federal são identificadas como concluídas. |
| 3 | Avançar a partir da última etapa validada da Receita Federal. | O sistema permite avançar para a próxima etapa prevista. |
| 4 | Consultar a orientação da nova etapa. | O sistema identifica a SEFAZ e apresenta as instruções aplicáveis. |
| 5 | Verificar a indicação do objetivo da etapa. | O sistema apresenta a orientação relativa às isenções estaduais pertinentes, como ICMS. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | — |

---

# CT-007 — Gerar e baixar dossiê final de processo válido

| Campo | Informação |
|---|---|
| **Identificador** | CT-007 |
| **Versão** | 1 |
| **Suíte de teste** | ST-04 — Revisão e dossiê |
| **Autor** | Aurea Taissa Sá Lima |
| **Requisito coberto** | RF10 — Revisão Final e Geração de Dossiê |
| **Importância** | Alta |

### Resumo

Verifica se o sistema permite revisar um processo completo, gerar o dossiê final e disponibilizar seu download.

### Pré-condições

- Usuário autenticado com processo iniciado.
- Todos os campos e documentos obrigatórios preenchidos e validados.
- Revisão final sem pendências, com conclusão permitida.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar **Revisão Final**. | O sistema apresenta o resumo consolidado dos dados e documentos. |
| 2 | Verificar os indicadores de completude e validade. | O sistema informa que os dados estão completos, os documentos são válidos e o processo pode ser concluído. |
| 3 | Confirmar a veracidade das informações, conforme a interface disponível. | O sistema recebe a confirmação do usuário. |
| 4 | Selecionar **Finalizar e Gerar Dossiê**. | O sistema gera o dossiê e informa sua disponibilidade. |
| 5 | Verificar a situação do processo. | O processo passa para **COMPLETED** e o dossiê apresenta status **GENERATED**. |
| 6 | Selecionar a opção de download. | O sistema disponibiliza o arquivo compactado **.zip** do dossiê. |
| 7 | Conferir o arquivo obtido. | O arquivo é acessível e contém os documentos validados incluídos no dossiê. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | — |

---

# CT-008 — Impedir cadastro do quarto condutor autorizado

| Campo | Informação |
|---|---|
| **Identificador** | CT-008 |
| **Versão** | 1 |
| **Suíte de teste** | ST-05 — Regras de negócio |
| **Autor** | Aurea Taissa Sá Lima |
| **Regra coberta** | RN01 — Limite Estatutário de Condutores Autorizados |
| **Requisito relacionado** | RF09 — Controle de Indicação |
| **Importância** | Alta |

### Resumo

Verifica se o sistema limita a três os condutores autorizados de um processo **PcD Não Condutor** e impede o quarto cadastro.

### Pré-condições

- Usuário autenticado com processo de perfil **PcD Não Condutor**.
- Três condutores distintos já cadastrados com dados válidos.
- Dados válidos de um quarto condutor, ainda não cadastrado, disponíveis.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar a listagem de condutores autorizados. | O sistema apresenta os três condutores cadastrados. |
| 2 | Verificar o limite de condutores. | O sistema informa o máximo de três e desabilita ou oculta **Adicionar Novo Condutor**. |
| 3 | Tentar cadastrar um quarto condutor por requisição autenticada à API `POST /api/processes/{processId}/drivers`. | A API rejeita a inclusão com **HTTP 409 Conflict**. |
| 4 | Consultar novamente a listagem de condutores. | O total permanece em três, sem inclusão do quarto condutor. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | — |

---

# CT-009 — Impedir avanço com CNH sem restrição exigida

| Campo | Informação |
|---|---|
| **Identificador** | CT-009 |
| **Versão** | 1 |
| **Suíte de teste** | ST-05 — Regras de negócio |
| **Autor** | Aurea Taissa Sá Lima |
| **Regra coberta** | RN02 — Obrigatoriedade de Restrição na CNH |
| **Requisito relacionado** | RF01 — Fluxos Dinâmicos de Formulário; RF08 — Validação de Etapas |
| **Importância** | Alta |

### Resumo

Verifica se o sistema impede a validação da etapa de habilitação de um **PcD Condutor** quando a CNH não apresenta as restrições exigidas. A forma de capturar e verificar as restrições deve ser confirmada com a equipe, pois não está detalhada no contrato da API.

### Pré-condições

- Usuário autenticado com processo de perfil **PcD Condutor**.
- Etapa de validação da CNH disponível.
- CNH de teste válida quanto à data, mas sem anotação de restrição exigida.
- Demais exigências da etapa atendidas.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar a etapa de documentação da CNH. | O sistema apresenta a exigência de CNH com restrição para o perfil. |
| 2 | Enviar ou informar os dados da CNH de teste sem restrição. | O sistema recebe os dados para verificação, conforme o mecanismo de validação implementado. |
| 3 | Solicitar a validação da etapa. | O sistema verifica a exigência de restrição na CNH. |
| 4 | Verificar o resultado da validação. | O sistema informa que a CNH não atende à exigência de restrição. |
| 5 | Tentar avançar para a próxima etapa. | O sistema impede o avanço até que seja apresentada CNH com restrição válida. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | Validar com a equipe o campo ou mecanismo de conferência da restrição. |

---

# CT-010 — Impedir processo de isenção para veículo usado

| Campo | Informação |
|---|---|
| **Identificador** | CT-010 |
| **Versão** | 1 |
| **Suíte de teste** | ST-05 — Regras de negócio |
| **Autor** | Aurea Taissa Sá Lima |
| **Regra coberta** | RN03 — Exclusividade para Veículos Zero Quilômetros |
| **Requisito relacionado** | RF01 — Fluxos Dinâmicos de Formulário |
| **Importância** | Alta |

### Resumo

Verifica se o sistema impede a abertura do processo quando o usuário não confirma que a solicitação se refere exclusivamente à aquisição de veículo novo (0 km).

### Pré-condições

- Usuário cadastrado e autenticado, sem processo em andamento.
- Funcionalidade de início do processo disponível.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar a opção de iniciar processo de isenção. | O sistema apresenta a seleção do perfil e as informações iniciais. |
| 2 | Selecionar **PcD Condutor** e um tipo de deficiência válido. | O sistema registra as seleções. |
| 3 | Não confirmar a declaração de que o veículo é novo (0 km). | A confirmação obrigatória permanece ausente ou negativa. |
| 4 | Tentar iniciar o processo. | O sistema impede a criação e solicita a confirmação obrigatória. |
| 5 | Enviar, por requisição autenticada, `confirmsNewVehicleOnly: false` à rota `POST /api/processes`. | A API rejeita a requisição com **HTTP 400 Bad Request**. |
| 6 | Verificar se foi criado um processo. | Nenhum processo é criado a partir da tentativa rejeitada. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | — |

---

# CT-011 — Impedir faturamento em nome de terceiro

| Campo | Informação |
|---|---|
| **Identificador** | CT-011 |
| **Versão** | 1 |
| **Suíte de teste** | ST-05 — Regras de negócio |
| **Autor** | Aurea Taissa Sá Lima |
| **Regra coberta** | RN04 — Titularidade Inalienável do Benefício |
| **Requisito relacionado** | RF06 — Guia de Documentos Iniciais e Faturamento |
| **Importância** | Alta |

### Resumo

Verifica se o sistema impede a indicação de CPF de terceiro como titular do faturamento do veículo, preservando o CPF da pessoa com deficiência. A existência de campo ou rota específica para faturamento precisa ser confirmada, pois o contrato não a define.

### Pré-condições

- Usuário autenticado com processo **PcD Não Condutor** iniciado.
- CPF válido do titular vinculado ao usuário autenticado.
- Condutor autorizado com CPF distinto do titular cadastrado.
- Etapa de faturamento disponível para validação, conforme implementação do sistema.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar a etapa de orientação ou registro de faturamento do veículo. | O sistema informa que o faturamento deve ocorrer no CPF do titular PcD. |
| 2 | Verificar os dados de titularidade do processo. | O sistema identifica o titular pelo CPF associado ao requerente. |
| 3 | Tentar informar o CPF do condutor autorizado como titular do faturamento, caso o campo seja editável. | O sistema identifica que o CPF informado difere do titular do benefício. |
| 4 | Tentar confirmar a informação ou avançar. | O sistema impede a confirmação de faturamento em nome de terceiro. |
| 5 | Verificar a titularidade registrada. | O processo mantém o CPF da pessoa com deficiência como titular do benefício. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | Confirmar a existência de campo ou fluxo de faturamento e sua validação. |

---

# CT-012 — Impedir geração de dossiê com laudo médico vencido

| Campo | Informação |
|---|---|
| **Identificador** | CT-012 |
| **Versão** | 1 |
| **Suíte de teste** | ST-05 — Regras de negócio |
| **Autor** | Aurea Taissa Sá Lima |
| **Regra coberta** | RN05 — Padrão e Validade de Laudos Médicos |
| **Requisitos relacionados** | RF02 — Alerta e Bloqueio por Validade de Documentos; RF10 — Revisão Final e Geração de Dossiê |
| **Importância** | Alta |

### Resumo

Verifica se um laudo médico vencido impede a conclusão do processo e a geração do dossiê final. A validação da origem credenciada do laudo deverá ser coberta separadamente quando houver mecanismo especificado.

### Pré-condições

- Usuário autenticado com processo iniciado.
- Laudo médico de teste com data de validade anterior à data da execução.
- Demais dados e documentos do processo completos e válidos.
- Arquivo de teste em formato aceito, com tamanho inferior a 10 MB.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar o checklist de documentos do processo. | O sistema apresenta o laudo médico exigido. |
| 2 | Enviar o arquivo de laudo e informar a data de validade vencida. | O sistema recebe os dados e identifica o vencimento do documento. |
| 3 | Consultar a validação do documento. | O sistema indica que o laudo está vencido e não permite utilizá-lo para liberar a etapa. |
| 4 | Tentar validar e avançar na etapa correspondente. | O sistema retorna a validação com pendência de documento vencido e impede o avanço. |
| 5 | Consultar a revisão final do processo. | O sistema identifica pendência documental e informa que o processo não pode ser concluído. |
| 6 | Tentar gerar o dossiê final pela rota `POST /api/processes/{processId}/dossier`. | A API rejeita a geração com **HTTP 409 Conflict**, pois existem pendências. |
| 7 | Verificar o resultado. | O sistema não gera um dossiê final válido enquanto o laudo permanecer vencido. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| [Nome] | [DD/MM/AAAA] | Não executado | — | — |

---

# Evidências

As evidências de execução devem ser armazenadas na pasta:

`docs/testes/evidencias/`

### CT-001

- `CT-001-E1.png` — Formulário e checklist adaptados ao perfil PcD Condutor.

### CT-002

- `CT-002-E1.png` — Checklist antes do envio do documento.
- `CT-002-E2.png` — Checklist atualizado após upload.

### CT-003

- `CT-003-E1.png` — Orientação simplificada apresentada na etapa.

### CT-004

- `CT-004-E1.png` — Formulário parcialmente preenchido e salvo.
- `CT-004-E2.png` — Dados preservados após novo login.

### CT-005

- `CT-005-E1.png` — Validação de campo obrigatório não preenchido.
- `CT-005-E2.png` — Validação bem-sucedida após correção.

### CT-006

- `CT-006-E1.png` — Listagem de órgãos e status.
- `CT-006-E2.png` — Orientação da etapa subsequente da SEFAZ.

### CT-007

- `CT-007-E1.png` — Revisão final sem pendências.
- `CT-007-E2.png` — Dossiê gerado e download disponível.

### CT-008

- `CT-008-E1.png` — Limite de três condutores exibido.
- `CT-008-E2.png` — Resposta HTTP 409 à tentativa de quarto cadastro.

### CT-009

- `CT-009-E1.png` — Bloqueio por CNH sem restrição exigida.

### CT-010

- `CT-010-E1.png` — Exigência de confirmação de veículo novo.
- `CT-010-E2.png` — Resposta HTTP 400 ao envio de confirmação negativa.

### CT-011

- `CT-011-E1.png` — Validação da titularidade do CPF no faturamento.

### CT-012

- `CT-012-E1.png` — Laudo médico identificado como vencido.
- `CT-012-E2.png` — Revisão final com pendência documental.
- `CT-012-E3.png` — Resposta HTTP 409 à tentativa de geração do dossiê.

---

# 📊 Legenda

| Status | Significado |
|---|---|
| 🟢 Aprovado | Todos os passos apresentaram o resultado esperado. |
| 🔴 Reprovado | Pelo menos um passo apresentou resultado diferente do esperado. |
| 🟡 Bloqueado | Não foi possível iniciar ou executar o teste devido a uma dependência. |
| ⚪ Não executado | Teste ainda não foi executado. |

---

# 📌 Matriz de Rastreabilidade

| Caso de teste | Tipo | Requisito ou regra principal | Caso de uso relacionado |
|---|---|---|---|
| CT-001 | Funcional | RF01 | UC01 |
| CT-002 | Funcional | RF03 | UC03 |
| CT-003 | Funcional | RF04 | UC02 |
| CT-004 | Funcional | RF07 | UC02 |
| CT-005 | Funcional | RF08 | UC02 |
| CT-006 | Funcional | RF05 | UC02 |
| CT-007 | Funcional | RF10 | UC05 |
| CT-008 | Regra de negócio | RN01 | UC04 |
| CT-009 | Regra de negócio | RN02 | UC03 |
| CT-010 | Regra de negócio | RN03 | UC01 |
| CT-011 | Regra de negócio | RN04 | UC05 |
| CT-012 | Regra de negócio | RN05 | UC03, UC05 |

---

# Observações de QA

- **Divergência no alerta de vencimento:** RF02 descreve aviso para documento a menos de 15 dias do vencimento (limite parametrizado), enquanto o contrato da API define `EXPIRING_SOON` para até 30 dias. É necessário alinhar o critério antes de testar esse limite.
- **RN02 — CNH com restrição:** o contrato não define campo específico para códigos de restrição da CNH nem como sua conferência ocorre. O CT-009 depende dessa definição para execução objetiva.
- **RN04 — Titularidade:** o contrato não descreve campo ou endpoint específico para dados de faturamento e registro do veículo. O CT-011 depende da definição do fluxo implementado.
- **RN05 — Origem credenciada:** a regra exige origem credenciada dos laudos, mas o contrato não define metadados ou validação da entidade emissora. O CT-012 cobre vencimento, não credenciamento.
- **CT-003 — Tradução de termos:** o contrato fornece `simplifiedExplanation` na orientação da etapa, mas não especifica endpoint separado de glossário nem tooltip. O teste verifica a explicação simplificada; um teste específico de tooltip depende da interface.
- **CT-002 — Status visual:** os critérios Gherkin usam o estado visual “Enviado”, enquanto a API define `PENDING`, `VALID`, `EXPIRED` e `REJECTED`. O teste diferencia envio realizado de validação concluída.
- **CT-004 — Retomada:** o contrato garante recuperação do progresso e dados salvos, mas o redirecionamento automático para a etapa após login deve ser confirmado na interface.
- **Cobertura:** sete dos dez requisitos funcionais possuem caso de teste funcional dedicado. RF02, RF06 e RF09 aparecem em cenários de regras de negócio ou como requisitos relacionados, sem teste funcional exclusivo.
- **Dados de teste:** utilizar CPFs e CNHs sintéticos válidos quanto aos dígitos verificadores, quando exigidos pelo backend, sem utilizar dados pessoais reais.
