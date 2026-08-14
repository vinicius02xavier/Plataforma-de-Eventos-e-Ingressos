# Elite Dev — Plataforma de Eventos e Ingressos

Projeto completo de uma plataforma de eventos, com fluxo de catálogo, criação de eventos por organizador, compra e validação de ingressos, compartilhamento de ingresso, cancelamento e gestão de portaria.

A aplicação foi desenvolvida para cobrir o fluxo completo:

catálogo → organizador publica evento → cliente escolhe assento → compra do ingresso → QR Code → compartilhamento → validação na portaria

## Stack

- Front-end: React + Vite + TypeScript
- Back-end: Node.js + Express + TypeScript
- Banco: Prisma + SQLite para desenvolvimento local
- Autenticação: JWT + bcryptjs
- Validação: Zod
- Catálogo externo: TMDb
- QR Code: `qrcode`
- Leitura de QR: `html5-qrcode`
- Testes: Vitest + Supertest

## Funcionalidades entregues

### Front-end

- Página inicial com catálogo de eventos
- Busca por texto com suporte à tecla Enter
- Limpeza automática da busca quando o campo é apagado
- Detalhes do evento com informações do evento e disponibilidade
- Compra do ingresso com seleção de assento em mapa visual
- Exibição de assentos já ocupados para evitar duplicidade de reserva
- Checkout com simulação de aprovação/recusa de pagamento
- Meus ingressos com listagem ativa e cancelável
- Compartilhamento de ingresso por link público
- Painel do organizador com catálogo integrado e criação de eventos
- Gerenciamento de eventos: publicar, cancelar e arquivar
- Gestão de tickets por parte do cliente e do organizador
- Painel da portaria com leitura de QR Code e fallback por código manual
- Exibição do ID do evento ativo em card separado abaixo da validação

### Back-end

- Autenticação por papéis: `ORGANIZER`, `CUSTOMER`, `GATE`
- CRUD de eventos e controle de status (`DRAFT`, `PUBLISHED`, `CANCELLED`)
- Controle de capacidade e disponibilidade por evento
- Reservas com transação para evitar venda acima da capacidade
- Seleção de assentos com validação de ocupação
- Geração de QR Code e token de ingresso
- Validação de ingresso por QR ou código manual
- Prevenção de uso duplicado de ingresso
- Cancelamento de ingresso
- Cancelamento de evento e atualização de disponibilidade
- Integração com catálogo externo do TMDb
- Rotas de organização, cliente e portaria separadas por autorização

## Fluxo principal da aplicação

1. O organizador acessa o painel administrativo.
2. Busca filmes no catálogo e seleciona um para criar um evento.
3. Publica o evento com dados de data, local, capacidade e preço.
4. O cliente acessa a página inicial e escolhe um evento.
5. O cliente seleciona assento(s) disponíveis e conclui a compra.
6. O sistema gera o ingresso e o QR Code.
7. O cliente pode visualizar, compartilhar ou cancelar o ticket.
8. A portaria valida o ingresso por QR ou código manual.
9. O sistema responde: válido, inválido, já utilizado ou evento errado.

## Credenciais de demonstração

Senha padrão de todos os usuários seed: `EliteDev@2026`

| Papel | E-mail |
|---|---|
| Organizador | `organizer@elite.dev` |
| Cliente 1 | `client1@elite.dev` |
| Cliente 2 | `client2@elite.dev` |
| Portaria | `gate@elite.dev` |

## Stack e decisões técnicas

- Front-end em React para dashboard e fluxo interativo.
- Vite para build e desenvolvimento rápido.
- Express para API REST.
- Prisma como camada de acesso ao banco.
- SQLite como banco local para desenvolvimento e testes rápidos.
- Postgres recomendado para produção.
- JWT para autenticação e assinatura dos tokens de ingresso.
- QR Code + html5-qrcode para criação e leitura dos ingressos.

## Configuração local

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

API disponível em: `http://localhost:3333`

### 2. Front-end

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

App disponível em: `http://localhost:5173`

## Variáveis de ambiente

### Backend

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="troque-por-uma-chave-forte"
FRONTEND_URL="http://localhost:5173"
PORT=3333
TMDB_API_KEY="opcional"
```

### Front-end

```env
VITE_API_URL="http://localhost:3333/api"
```

## TMDb

A aplicação funciona sem chave do TMDb no fluxo principal, exibindo mensagem quando o catálogo externo não estiver configurado.

Se quiser ativar a integração:

1. gere uma chave na plataforma TMDb;
2. adicione `TMDB_API_KEY` no backend;
3. reinicie a API.

## Banco de dados

O projeto usa SQLite por padrão em desenvolvimento local:

```env
DATABASE_URL="file:./dev.db"
```

Para produção, o ideal é usar PostgreSQL. O Prisma está preparado para isso, e o banco deve ser trocado em:

- `backend/prisma/schema.prisma`
- variáveis de ambiente do ambiente de deploy

## Testes e verificação

O projeto inclui testes do backend para validar regras principais de negócio e fluxo de ingresso.

Também foi validado com build do frontend:

```bash
cd frontend && npm run build
```

Resultado esperado: build concluído com sucesso.

## Estrutura do projeto

```text
elite-dev-events/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── tests/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Fluxo de avaliação recomendado

1. Acesse como cliente.
2. Escolha um evento publicado.
3. Selecione assentos disponíveis.
4. Conclua a compra.
5. Abra "Meus ingressos".
6. Compartilhe o QR ou o link do ingresso.
7. Entre como portaria e valide o ingresso.
8. Teste também a rejeição por ingresso já usado ou evento errado.
9. Entre como organizador e publique um evento a partir do catálogo.
10. Verifique a gestão de status, cancelamento e atualização da lista.

## Observações finais

Este projeto foi levado além do escopo base do desafio e já contempla:

- experiência completa de compra e validação;
- painel de organização funcional;
- gestão de eventos e tickets;
- regras de negócio mais robustas para capacidade, ocupação e concorrência.

A IA foi usada como apoio para arquitetura, revisão de código, sugestões de UX, valiação de fluxos e documentação, mas o projeto final foi estruturado e validado como uma aplicação funcional completa de ponta a ponta.