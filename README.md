# pi4-2026-2-equipe-3

Projeto desenvolvido para o PI4 (2026.2) - equipe 3.

### Protótipo de Alta Fidelidade
- **Figma**: [isenta+ - Landing Page](https://www.figma.com/design/KZ9Q8nZQ2uAuv7EIkMZTz0/isenta--%E2%80%94-Landing-Page?node-id=0-1&t=4uZWub6s4floXcL9-1)

---

## Stack Tecnológica

### Frontend
- **React 19**: biblioteca para construção da interface
- **Vite 8**: build tool e servidor de desenvolvimento
- **TypeScript**: tipagem estática
- **Tailwind CSS 4**: estilização utilitária
- **Axios**: cliente HTTP para consumir a API

### Backend
- **.NET 10 (ASP.NET Core)**: API REST
- **Entity Framework Core 10**: camada de acesso a dados (ORM)
- **Npgsql**: provider PostgreSQL para o EF Core
- **JWT Bearer**: autenticação
- **Swagger (Swashbuckle)**: documentação da API

### Banco de dados
- **PostgreSQL 17**: banco de dados relacional
- **Migrations do EF Core**: versionamento do schema

### Infraestrutura
- **Docker**: containerização dos 3 serviços
- **Docker Compose**: orquestração dos 3 serviços

---

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  (Windows/macOS) ou [Docker Engine](https://docs.docker.com/engine/install/) + plugin Compose (Linux)
- Docker Compose **v2** (`docker compose version`)

Não é necessário instalar PostgreSQL, .NET SDK ou Node.js para rodar a
aplicação — tudo roda dentro dos containers.

> **Windows:** o Docker precisa estar com o modo Linux habilitado
> (clique direito no ícone do Docker na bandeja → _Switch to Linux containers_).

---

## Configuração inicial

Clone o repositório e crie o arquivo de ambiente:

```bash
git clone https://github.com/Lettxys/pi4-2026-2-equipe-3.git
cd pi4-2026-2-equipe-3

# Linux/macOS/Git Bash
cp .env.example .env

# Windows PowerShell / CMD
copy .env.example .env
```

O arquivo `.env` guarda **todas** as configurações (usuário, senha, banco,
portas, JWT). Ele **não é versionado** — o `.env.example` é, para servir de
modelo. Ajuste os valores no `.env` conforme o section
[Variáveis de ambiente](#variáveis-de-ambiente).

---

## Subindo a aplicação com Docker

Todos os comandos são executados **na raiz do projeto** e leem o `.env`.

### Comandos

| Cenário            | Comando                         |
| ------------------ | ------------------------------- |
| Só banco           | `docker compose up -d db`       |
| Banco + backend    | `docker compose up -d backend`  |
| Só frontend        | `docker compose up -d frontend` |
| Aplicação completa | `docker compose up -d`          |
| Rebuild            | `docker compose up -d --build`  |

---

## Rotas e URLs de acesso

### Endereços dos serviços

| Serviço           | URL / Porta                | Descrição                         |
| ----------------- | -------------------------- | --------------------------------- |
| **Frontend**      | http://localhost:5173      | Aplicação React                   |
| **Backend (API)** | http://localhost:3000      | Raiz da API REST                  |
| **Swagger UI**    | http://localhost:3000/docs | Documentação interativa da API    |
| **PostgreSQL**    | `localhost:5432`           | Porta publicada do banco de dados |

### Conectando no banco de dados

A partir do host, usando um cliente como **pgAdmin**, **DBeaver** ou **TablePlus**:

| Campo   | Valor                            |
| ------- | -------------------------------- |
| Host    | `localhost`                      |
| Porta   | `5432` (`POSTGRES_PORT`)         |
| Banco   | `isenta` (`POSTGRES_DB`)         |
| Usuário | `postgres` (`POSTGRES_USER`)     |
| Senha   | `postgres` (`POSTGRES_PASSWORD`) |

Ou por linha de comando, a partir de um container qualquer na rede do projeto:

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```
---

## Variáveis de ambiente

Todas as configurações ficam no arquivo `.env` na raiz. O Docker Compose faz a
interpolação (`${NOME_DA_VARIAVEL}`) automaticamente.

### PostgreSQL

| Variável            | Padrão      | Descrição                                                                              |
| ------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `POSTGRES_HOST`     | `localhost` | Host do banco para a API. Só usado fora do Docker; no Compose a API sempre recebe `db` |
| `POSTGRES_USER`     | `postgres`  | Usuário criado no banco                                                                |
| `POSTGRES_PASSWORD` | `postgres`  | Senha do usuário                                                                       |
| `POSTGRES_DB`       | `isenta`    | Nome do banco de dados                                                                 |
| `POSTGRES_PORT`     | `5432`      | Porta publicada no host (dentro do container é sempre `5432`)                          |

> Alterar `POSTGRES_USER`, `POSTGRES_PASSWORD` ou `POSTGRES_DB` **depois** que o
> volume `db_data` foi criado não tem efeito. Para recomeçar do zero:
> `docker compose down -v && docker compose up -d db`.

### Backend

| Variável                               | Padrão                 | Descrição                                                                                                                      |
| -------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `BACKEND_PORT`                         | `3000`                 | Porta da API publicada no host                                                                                                 |
| `ASPNETCORE_ENVIRONMENT`               | `Development`          | `Development` habilita o Swagger em `/docs`                                                                                    |
| `JWT_SECRET`                           | _(trocar)_             | Segredo de assinatura do token. **Obrigatório**, mínimo de 32 caracteres — a API não sobe sem ele                              |
| `JWT_ISSUER`                           | `pi4-equipe-3`         | Emissor do token                                                                                                               |
| `JWT_AUDIENCE`                         | `pi4-equipe-3-clients` | Audiência do token                                                                                                             |
| `JWT_EXPIRES_IN_MINUTES`               | `60`                   | Validade do token em minutos                                                                                                   |
| `PASSWORD_RESET_TOKEN_EXPIRES_MINUTES` | `30`                   | Validade do token de redefinição de senha                                                                                      |
| `STORAGE_DIR`                          | `./storage`            | Raiz dos arquivos enviados (documentos e dossiês). No Compose vira `/app/storage`, montado em um volume chamado `storage_data` |

### E-mail (recuperação de senha)

SMTP é **opcional**. Se `SMTP_HOST` ficar vazio, a API não envia e-mail: o link de
redefinição é apenas registrado no log da aplicação, no nível `Warning` —
comportamento pensado para desenvolvimento.

```bash
docker compose logs -f backend | grep SMTP_HOST
```

| Variável        | Padrão                  | Descrição                                               |
| --------------- | ----------------------- | ------------------------------------------------------- |
| `SMTP_HOST`     | _(vazio)_               | Servidor SMTP. Vazio = desabilita o envio e loga o link |
| `SMTP_PORT`     | `587`                   | Porta do SMTP (com TLS)                                 |
| `SMTP_USER`     | _(vazio)_               | Usuário do SMTP. Vazio = envio anônimo                  |
| `SMTP_PASSWORD` | _(vazio)_               | Senha do SMTP                                           |
| `SMTP_FROM`     | `no-reply@isenta.local` | Remetente                                               |

### Frontend

| Variável               | Padrão                  | Descrição                                                                 |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------- |
| `FRONTEND_PORT`        | `5173`                  | Porta do frontend publicada no host                                       |
| `VITE_API_URL`         | `http://localhost:3000` | URL da API chamada pelo navegador                                         |
| `FRONTEND_URL`         | `http://localhost:5173` | URL pública do frontend, usada para montar o link de redefinição de senha |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Origens liberadas no CORS, separadas por vírgula                          |

> ⚠️ **Ao mudar `BACKEND_PORT`, mude também a porta em `VITE_API_URL`** para que
> o frontend continue enxergando a API.

> ⚠️ **`FRONTEND_URL` precisa ser a URL pública** (a que o usuário abre no
> navegador), não a interna do container. É ela que entra no link enviado por
> e-mail. O mesmo vale para `CORS_ALLOWED_ORIGINS`: se o frontend roda em outra
> porta ou host, inclua a origem lá.

### Como as variáveis chegam em cada serviço

| Variável no `.env`                                                                                                                                         | Vai para                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `POSTGRES_*`                                                                                                                                               | container do banco **e** o da API |
| `BACKEND_PORT`, `ASPNETCORE_ENVIRONMENT`, `JWT_*`, `PASSWORD_RESET_TOKEN_EXPIRES_MINUTES`, `STORAGE_DIR`, `SMTP_*`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` | container da API                  |
| `FRONTEND_PORT`, `VITE_API_URL`                                                                                                                            | container do frontend             |

> ℹ️ A API monta a conexão com o banco a partir das variáveis `POSTGRES_*` e
> aplica as migrations ao subir.

## Banco de dados

Com o backend já rodando, para popular o banco com dados sintéticos (20 usuários, 17 processos, +10 linhas em
cada tabela):

```bash
docker compose cp backend/src/System.Api/Data/Seed/seed.sql db:/tmp/seed.sql
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /tmp/seed.sql'
```

O script apaga os dados existentes antes de inserir.
Senha para todos os usuários: `Senha@123`.
Administrador: `admin@example.com`.

## Estrutura do projeto

```
pi4-2026-2-equipe-3/
├── .env.example
├── .env
├── .gitignore
├── compose.yaml
│
├── backend/
│   ├── .dockerignore
│   ├── Dockerfile
│   └── src/
│       └── System.Api/
│           ├── System.Api.csproj
│           ├── System.Api.slnx
│           ├── System.Api.http
│           ├── Program.cs
│           ├── appsettings.json
│           ├── appsettings.Development.json
│           ├── Properties/
│           │   └── launchSettings.json
│           ├── Controllers/
│           ├── Configuration/
│           │   └── AppOptions.cs
│           ├── DTO/
│           │   ├── Auth/
│           │   └── Common/
│           ├── Models/
│           ├── Data/
│           │   ├── Configuration/
│           │   └── Seed/
│           ├── Interfaces/
│           ├── Middlewares/
│           ├── Migrations/
│           ├── Repositories/
│           ├── Security/
│           └── Services/
│
├── frontend/
│   ├── .dockerignore
│   ├── .gitignore
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── index.css
│       └── main.tsx
│
└── docs/
    ├── 1.Transcrição - Reunião 30.08.pdf
    ├── Contrato da API.pdf
    └── testes/
        └── evidencias/
            └── casos-de-teste.md
```

---

## Autenticação

As rotas de autenticação seguem o documento `docs/Contrato da API.pdf`.

| Rota                        | Método   | Quem pode chamar                   |
| --------------------------- | -------- | ---------------------------------- |
| `/api/auth/register`        | `POST`   | público                            |
| `/api/auth/login`           | `POST`   | público                            |
| `/api/auth/me`              | `GET`    | autenticado                        |
| `/api/auth/forgot-password` | `POST`   | público                            |
| `/api/auth/reset-password`  | `POST`   | público                            |
| `/api/auth/change-password` | `PATCH`  | autenticado                        |
| `/api/auth/logout`          | `POST`   | autenticado                        |
| `/api/users/{userId}`       | `DELETE` | o próprio dono ou um administrador |

Envie o token no header: `Authorization: Bearer <accessToken>`.

### Autorização

Duas camadas, de propósito:

1. **Fallback policy** — toda rota exige usuário autenticado por padrão. Uma
   rota nova não vira brecha por esquecimento de um `[Authorize]`.
2. **`[Authorize]` explícito** — cada controller protegido declara a exigência.

`DELETE /api/users/{userId}` usa a policy `SelfOrAdmin`, que compara o `userId`
da rota com o `sub` do token e libera o acesso se o usuário for `ADMIN`.

A policy roda **antes** do service, então ela não diz se a conta existe:
quem não é o dono recebe `403` tanto para a conta de outra pessoa quanto para um
`userId` que não existe. Só quem passa pela policy descobre — e aí o `404` é
verdadeiro.

### Senhas

PBKDF2-HMAC-SHA256, 210.000 iterações, salt de 16 bytes, hash de 32 bytes.
Armazenado em `usuario.senha_hash` no formato
`pbkdf2-sha256$<iterações>$<salt base64>$<hash base64>`. A senha em claro nunca
é gravada.

### Invalidar tokens

| Evento                       | Efeito                                         |
| ---------------------------- | ---------------------------------------------- |
| `POST /api/auth/logout`      | o `jti` do token vai para `token_revogado`     |
| `DELETE /api/users/{userId}` | a conta é anonimizada e `senha_hash` é apagado |

Trocar a senha não invalida tokens já emitidos. Um `accessToken` continua válido
até expirar ou até um `logout`.

### Token de redefinição de senha

Só o mais recente vale. Cada `forgot-password` apaga os tokens anteriores não
usados da mesma pessoa, e o token é de uso único — a segunda tentativa com o
mesmo token volta `400`.

### Conta e LGPD

`DELETE /api/users/{userId}` anonimiza a conta: nome, CPF, e-mail, telefone,
senha e endereço são apagados. Documentos, condutores e dossiês são removidos
junto com os arquivos do `STORAGE_DIR`. Os processos continuam no banco, sem
vínculo com a pessoa, apenas para estatística.

Não existe usuário administrador criado por seed. Para promover alguém:

```sql
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  -c "UPDATE usuario SET papel = 'ADMIN' WHERE email = 'voce@example.com';"
```

### CPF

O CPF é validado de verdade, com os dois dígitos verificadores, e é gravado
sempre com 11 dígitos (máscara e pontos são aceitos na entrada). O exemplo
`12345678900` do contrato é matematicamente inválido e é rejeitado com `400` —
use CPFs válidos nos exemplos, como `11144477735` e `52998224725` (veja
`System.Api.http`). O `98765432100`, esse sim, passa na validação.

---

## Comandos úteis

```bash
# Ver o que está rodando e em qual porta
docker compose ps

# Acompanhar os logs (de um serviço ou de todos)
docker compose logs -f
docker compose logs -f backend
docker compose logs -f db

# Derrubar os containers (os dados do banco são mantidos)
docker compose down

# Derrubar TUDO, incluindo o banco de dados e as imagens
docker compose down -v

# Reiniciar apenas um serviço
docker compose restart backend

# Reaplicar o .env sem rebuild (útil após mudar só variáveis)
docker compose up -d --force-recreate

# Abrir um shell dentro do container do backend
docker compose exec backend bash

# Conectar no PostgreSQL
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# Atualizar o .NET SDK/Runtime dentro do container
docker compose exec backend dotnet --info
```
