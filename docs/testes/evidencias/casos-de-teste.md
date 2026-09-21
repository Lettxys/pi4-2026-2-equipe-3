# Casos de Teste

## Projeto
Sistema de Isenção para Aquisição de Veículos

## Responsável
Aurea Taissa Sa Lima — QA

---

# Suíte de Testes

| Código | Suíte | Descrição |
|---|---|---|
| ST-01 | Gestão do processo de isenção | Controle das etapas do processo e validação preliminar dos documentos enviados |

---

# CT-001 — Bloquear acesso à etapa seguinte antes da conclusão da etapa anterior

| Campo | Informação |
|---|---|
| **Identificador** | CT-001 |
| **Versão** | 1 |
| **Suíte de teste** | ST-01 — Gestão do processo de isenção |
| **Autor** | Aurea Taissa Sa Lima |
| **Requisito coberto** | MVP — Fluxo sequencial com checkpoints |
| **Importância** | Alta |

### Resumo

Verifica se o sistema impede o acesso ou preenchimento de uma etapa
posterior enquanto a etapa anterior do processo ainda não foi concluída.

### Pré-condições

- Usuário cadastrado e autenticado no sistema.
- Usuário possui um processo de isenção disponível.
- O processo possui etapas organizadas de forma sequencial.
- A primeira etapa ainda não foi concluída.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar o sistema após realizar a autenticação. | O sistema exibe a área do usuário. |
| 2 | Acessar o processo de isenção. | O sistema exibe as etapas do processo em sequência. |
| 3 | Verificar a primeira etapa. | A primeira etapa é apresentada como disponível ou pendente. |
| 4 | Não concluir a primeira etapa. | A primeira etapa permanece pendente ou incompleta. |
| 5 | Tentar acessar a segunda etapa. | O sistema bloqueia o acesso ou preenchimento da segunda etapa. |
| 6 | Verificar a indicação apresentada para a etapa bloqueada. | O sistema informa que a etapa anterior precisa ser concluída. |
| 7 | Preencher os dados necessários e concluir a primeira etapa. | O sistema registra a conclusão da primeira etapa. |
| 8 | Acessar novamente a segunda etapa. | O sistema libera a segunda etapa para visualização e preenchimento. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| Aurea Taissa | [DD/MM/AAAA] | Não executado | — | — |

---

# 🧪 CT-002 — Identificar documento com informações ausentes ou inconsistentes

| Campo | Informação |
|---|---|
| **Identificador** | CT-002 |
| **Versão** | 1 |
| **Suíte de teste** | ST-01 — Gestão do processo de isenção |
| **Autor** | Aurea Taissa Sa Lima |
| **Requisito coberto** | MVP — Validação preliminar de documentos |
| **Importância** | Alta |

### Resumo

Verifica se o sistema realiza uma validação preliminar do documento enviado
e identifica informações obrigatórias ausentes ou inconsistentes,
orientando o usuário sobre a necessidade de correção.

### Pré-condições

- Usuário cadastrado e autenticado no sistema.
- Usuário possui um processo de isenção disponível.
- Existe uma etapa que exige o envio de documentação.
- Existem regras de validação configuradas para os documentos.
- Está disponível um documento de teste contendo uma informação obrigatória ausente ou inconsistente.

### Passos

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar o sistema após realizar a autenticação. | O sistema exibe a área do usuário. |
| 2 | Acessar o processo de isenção e selecionar uma etapa que exige documentação. | O sistema exibe a opção para enviar um documento. |
| 3 | Selecionar um documento contendo uma informação obrigatória ausente ou inconsistente. | O sistema apresenta o arquivo selecionado para envio. |
| 4 | Enviar o documento. | O sistema inicia a validação preliminar do documento. |
| 5 | Aguardar a conclusão da análise. | O sistema apresenta o resultado da validação. |
| 6 | Consultar o resultado da validação. | O sistema identifica e informa a existência da informação ausente ou inconsistente, quando detectada pelas regras configuradas. |
| 7 | Verificar a orientação apresentada. | O sistema orienta o usuário sobre a necessidade de corrigir, preencher ou revisar a informação identificada. |
| 8 | Corrigir o documento e enviá-lo novamente. | O sistema permite realizar uma nova validação do documento corrigido. |

### Execução

| Testador | Data | Status | Defeito | Observações |
|---|---|---|---|---|
| Aurea Taissa | [DD/MM/AAAA] | Não executado | — | — |

---

# 📸 Evidências

As evidências de execução devem ser armazenadas na pasta:

`docs/testes/evidencias/`

### CT-001

- `CT-001-E1.png` — Sistema bloqueando o acesso à etapa seguinte enquanto a etapa anterior não foi concluída.
- `CT-001-E2.png` — Segunda etapa liberada após a conclusão da etapa anterior.

### CT-002

- `CT-002-E1.png` — Documento enviado para validação.
- `CT-002-E2.png` — Sistema identificando informação ausente ou inconsistente.
- `CT-002-E3.png` — Orientação apresentada para correção do documento.

---

# 📊 Legenda

| Status | Significado |
|---|---|
| 🟢 Aprovado | Todos os passos apresentaram o resultado esperado. |
| 🔴 Reprovado | Pelo menos um passo apresentou resultado diferente do esperado. |
| 🟡 Bloqueado | Não foi possível iniciar ou executar o teste devido a uma dependência. |
| ⚪ Não executado | Teste ainda não foi executado. |
