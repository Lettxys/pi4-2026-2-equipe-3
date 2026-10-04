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
> (clique direito no ícone do Docker na bandeja → *Switch to Linux containers*).

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

| Cenário | Comando |
|---|---|
| Só banco | `docker compose up -d db` |
| Banco + backend | `docker compose up -d backend` |
| Só frontend | `docker compose up -d frontend` |
| Aplicação completa | `docker compose up -d` |
| Rebuild | `docker compose up -d --build` |

---

## Rotas e URLs de acesso

### Endereços dos serviços

| Serviço | URL / Porta | Descrição |
|---|---|---|
| **Frontend** | http://localhost:5173 | Aplicação React |
| **Backend (API)** | http://localhost:3000 | Raiz da API REST |
| **Swagger UI** | http://localhost:3000/docs | Documentação interativa da API |
| **PostgreSQL** | `localhost:5432` | Porta publicada do banco de dados |

### Conectando no banco de dados

A partir do host, usando um cliente como **pgAdmin**, **DBeaver** ou **TablePlus**:

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Porta | `5432` (`POSTGRES_PORT`) |
| Banco | `isenta` (`POSTGRES_DB`) |
| Usuário | `postgres` (`POSTGRES_USER`) |
| Senha | `postgres` (`POSTGRES_PASSWORD`) |

Ou por linha de comando, a partir de um container qualquer na rede do projeto:

```bash
docker compose exec db psql -U postgres -d isenta
```
---

## Variáveis de ambiente

Todas as configurações ficam no arquivo `.env` na raiz. O Docker Compose faz a
interpolação (`${NOME_DA_VARIAVEL}`) automaticamente.

### PostgreSQL

| Variável | Padrão | Descrição |
|---|---|---|
| `POSTGRES_USER` | `postgres` | Usuário criado no banco |
| `POSTGRES_PASSWORD` | `postgres` | Senha do usuário |
| `POSTGRES_DB` | `isenta` | Nome do banco de dados |
| `POSTGRES_PORT` | `5432` | Porta publicada no host (dentro do container é sempre `5432`) |
| `POSTGRES_HOST` | `localhost` | Host do banco usado pela API. No Compose, o backend recebe `db` |

> Alterar `POSTGRES_USER`, `POSTGRES_PASSWORD` ou `POSTGRES_DB` **depois** que o
> volume `db_data` foi criado não tem efeito. Para recomeçar do zero:
> `docker compose down -v && docker compose up -d db`.

### Backend

| Variável | Padrão | Descrição |
|---|---|---|
| `BACKEND_PORT` | `3000` | Porta da API publicada no host |
| `ASPNETCORE_ENVIRONMENT` | `Development` | `Development` habilita o Swagger em `/docs` |
| `JWT_SECRET` | *(trocar)* | Segredo de assinatura do token |
| `JWT_ISSUER` | `pi4-equipe-3` | Emissor do token |
| `JWT_AUDIENCE` | `pi4-equipe-3-clients` | Audiência do token |
| `JWT_EXPIRES_IN_MINUTES` | `60` | Validade do token em minutos |

### Frontend

| Variável | Padrão | Descrição |
|---|---|---|
| `FRONTEND_PORT` | `5173` | Porta do frontend publicada no host |
| `VITE_API_URL` | `http://localhost:3000` | URL da API chamada pelo navegador |

> ⚠️ **Ao mudar `BACKEND_PORT`, mude também a porta em `VITE_API_URL`** para que
> o frontend continue enxergando a API.

### Como as variáveis chegam em cada serviço

| Variável no `.env` | Vai para |
|---|---|
| `POSTGRES_*` | container do banco **e** o da API |
| `BACKEND_PORT`, `ASPNETCORE_ENVIRONMENT`, `JWT_*` | container da API |
| `FRONTEND_PORT`, `VITE_API_URL` | container do frontend |

> ℹ️ **Estado atual:** a API monta a conexão com o banco a partir das variáveis
> `POSTGRES_*` e aplica as migrations ao subir. O `Program.cs` ainda não lê
> `JWT_*` nem configura CORS.

## Banco de dados

Com o backend já rodando, para popular o banco com dados sintéticos (20 usuários, 17 processos, +10 linhas em
cada tabela):

```bash
docker compose cp backend/src/System.Api/Data/Seed/seed.sql db:/tmp/seed.sql
docker compose exec db sh -c "psql -U postgres -d isenta -v ON_ERROR_STOP=1 -f /tmp/seed.sql"
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
│           ├── DTO/
│           ├── Models/
│           ├── Data/
│           │   ├── Configuration/
│           │   └── Seed/
│           ├── Interfaces/
│           ├── Middlewares/
│           ├── Migrations/
│           ├── Repositories/
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
docker compose exec db psql -U postgres -d isenta

# Atualizar o .NET SDK/Runtime dentro do container
docker compose exec backend dotnet --info
```
