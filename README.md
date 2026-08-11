# Elite Dev — Plataforma de Eventos e Ingressos

Implementação de referência para o desafio **Elite Dev 2026**.

A solução foi estruturada para entregar primeiro o fluxo ponta a ponta:

**catálogo externo → organizador cria evento → cliente reserva → pagamento simulado → ingresso/QR → compartilhamento → portaria valida**

## Stack

- Front-end: React + Vite + TypeScript
- Back-end: Node.js + Express + TypeScript
- ORM: Prisma
- Banco: SQLite por padrão, simples para avaliação local
- Autenticação: JWT + bcrypt
- Validação: Zod
- Catálogo externo: TMDb
- QR Code: `qrcode`
- Leitura de QR: `html5-qrcode`

## Requisitos atendidos

- Navegação e busca de eventos
- Criação/gerenciamento de eventos pelo organizador
- Compra por quantidade de ingressos (modelo "pista")
- Controle de capacidade/estoque
- Pagamento simulado com aprovação e recusa
- Área "Meus ingressos"
- QR Code por ingresso
- Link público de compartilhamento
- Portaria com leitura de QR e digitação manual
- Retornos: válido, inválido, já utilizado e evento errado
- Integração com TMDb
- Três papéis: ORGANIZER, CUSTOMER, GATE
- Persistência de eventos, reservas e ingressos
- Proteção contra venda acima da capacidade em transação
- Token de ingresso aleatório e não previsível
- Validação de ingresso apenas uma vez
- Seeds para avaliação
- Testes básicos
- Docker Compose opcional para PostgreSQL
- Documentação de uso de IA

## Credenciais de demonstração

Senha de todos os usuários seed: `EliteDev@2026`

| Papel | E-mail |
|---|---|
| Organizador | `organizer@elite.dev` |
| Cliente 1 | `client1@elite.dev` |
| Cliente 2 | `client2@elite.dev` |
| Portaria | `gate@elite.dev` |

## Execução rápida

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend: `http://localhost:3333`

### 2. Front-end

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Front-end: `http://localhost:5173`

## TMDb

A aplicação funciona sem chave TMDb para o fluxo principal, exibindo uma mensagem caso o catálogo externo não esteja configurado.

Para habilitar:

1. crie uma chave no TMDb;
2. coloque `TMDB_API_KEY` no `backend/.env`;
3. reinicie o backend.

## Banco

O padrão é SQLite:

```env
DATABASE_URL="file:./dev.db"
```

O projeto também possui `docker-compose.yml` com PostgreSQL para quem quiser trocar o banco.

Se mudar para PostgreSQL, ajuste o provider em `backend/prisma/schema.prisma` e a `DATABASE_URL`.

## Fluxo sugerido para avaliação

1. Entrar como cliente.
2. Abrir um evento publicado.
3. Comprar 1 ou mais ingressos.
4. Escolher pagamento aprovado.
5. Abrir "Meus ingressos".
6. Abrir o ingresso e copiar o link de compartilhamento.
7. Sair e entrar como portaria.
8. Validar o QR ou informar o código.
9. Repetir a validação para observar o retorno "já utilizado".
10. Entrar como organizador e criar outro evento a partir de um filme do catálogo.

## Pagamento simulado

No checkout existem duas opções:

- Aprovar pagamento
- Recusar pagamento

Não há cobrança financeira real.

## Segurança do ingresso

O QR contém uma URL com um **token JWT assinado pelo servidor**, contendo apenas o identificador do ingresso e um tipo específico de token.

O ingresso também possui um segredo opaco de alta entropia no fluxo de criação, cujo hash é persistido no banco. O link de compartilhamento é assinado e expira em 30 dias.

Na validação:

- o servidor verifica a assinatura do link;
- recupera o ingresso pelo ID;
- confere se o ingresso pertence ao evento informado;
- verifica se já foi utilizado;
- usa uma atualização condicional (`usedAt: null`) para impedir duas validações concorrentes.

## Concorrência

A compra usa uma transação do Prisma. O estoque é decrementado somente quando existe disponibilidade suficiente. A operação aborta se a capacidade disponível não comportar a quantidade solicitada.

Para uma aplicação de escala maior, eu substituiria SQLite por PostgreSQL e reforçaria o controle com operações atômicas/locks apropriados ao banco.

## Estrutura

```text
elite-dev-events/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── lib/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── tests/
│       ├── app.ts
│       └── server.ts
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── types/
│       ├── App.tsx
│       └── main.tsx
├── docker-compose.yml
└── README.md
```

## Uso de IA

A IA foi usada como ferramenta de apoio para:

- estruturar o projeto inicial;
- revisar alternativas de arquitetura;
- gerar código repetitivo;
- sugerir validações e testes;
- revisar documentação.

As decisões de produto/arquitetura que devem ser personalizadas antes da entrega são:

- identidade visual;
- regras de negócio;
- textos;
- tratamento de erros;
- estratégia final de banco;
- estratégia de deploy;
- cobertura de testes;
- decisões de segurança;
- commits e histórico do Git.

A intenção é que este repositório seja uma **base de implementação para revisão**, e não um substituto da autoria e das decisões do candidato.

## Pontos que eu melhoraria antes da entrega

- adicionar refresh token;
- implementar rate limiting;
- usar PostgreSQL em produção;
- adicionar testes E2E;
- adicionar observabilidade;
- adicionar cancelamento com devolução ao estoque;
- criar mapa de assentos se quiser explorar o segundo modelo de reserva;
- configurar deploy;
- criar commits pequenos e descritivos ao longo do desenvolvimento.
