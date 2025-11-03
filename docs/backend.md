# Amex Store – Backend Overview

Este diretório descreve como executar a API criada para a Amex Store, a estrutura dos modelos e os principais endpoints disponíveis.

## Stack

- **Node.js 20+** (ESM)
- **Express** (servidor HTTP)
- **Prisma** (ORM) com **SQLite** em desenvolvimento
- **Zod** para validação
- **JWT** + cookies httpOnly para autenticação
- **Multer + Sharp** para processamento de avatares

## Preparando o ambiente

1. Copie o arquivo `.env.example` para `.env` e ajuste os valores:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` aponta para `file:./prisma/dev.db` por padrão.
   - Gere segredos fortes para `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` e `SESSION_COOKIE_SECRET`.
   - Ajuste `CORS_ORIGIN` para a origem onde o front-end roda (por exemplo, `http://localhost:5173`).

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Rode as migrations e seeds (gera banco e dados de exemplo):

   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. Inicie a API:

   ```bash
   npm run server:dev
   ```

   A API ficará disponível em `http://localhost:4000` (ajuste em `APP_PORT` se necessário).

## Estrutura de diretórios

```
server/
├── config/          # env, prisma e storage (upload)
├── controllers/     # lógica das rotas
├── middleware/      # autenticação, validações, erros
├── routes/          # definição das rotas express
├── scripts/         # seed de banco
├── uploads/         # avatares processados
├── utils/           # helpers (serializers, cart, order, etc.)
└── index.js         # entrypoint do servidor

prisma/
└── schema.prisma    # modelagem do banco
```

## Modelagem (resumo)

- `User`: contas de clientes/admins com dados de perfil, avatares e preferências.
- `Product`: catálogo principal (slug, categoria, imagem, rating).
- `PriceOption`: variações de cada produto (duração, preço, estoque, URL de pagamento).
- `CartItem` / `Favorite`: relação do usuário com produtos.
- `Purchase` / `PurchaseItem`: pedidos e itens adquiridos.
- `Coupon`: cupons configuráveis (percentual ou valor fixo).
- `SupportTicket`: tickets abertos via chat/contato.
- `Session`: refresh tokens persistidos (para logout remoto).
- `PasswordResetToken`: suporte a fluxo de redefinição (a implementar).

## Endpoints principais

### Autenticação (`/api/auth`)

- `POST /register` – cria conta (`name`, `email`, `password`)
- `POST /login` – retorna `accessToken` e refresh em cookie httpOnly
- `POST /refresh` – renova tokens usando refresh token
- `POST /logout` – revoga sessão
- `GET /me` – retorna perfil autenticado

### Catálogo (`/api/products`)

- `GET /` – lista produtos com filtros (`search`, `category`, `featured`, `minPrice`, `maxPrice`, `inStock`, `page`, `pageSize`)
- `GET /highlights` – destaques/mais vendidos
- `GET /categories` – categorias distintas
- `GET /:id` – detalhes + opções de preço
- `GET /:id/options` – apenas price options

### Carrinho & Favoritos

- `GET /api/cart` – itens do carrinho do usuário
- `POST /api/cart` – adiciona (productId, priceOptionId?, quantity)
- `PATCH /api/cart/:id` – atualiza quantidade
- `DELETE /api/cart/:id` – remove item
- `DELETE /api/cart` – limpa carrinho

- `GET /api/favorites` – lista
- `POST /api/favorites` – adiciona (`productId`)
- `DELETE /api/favorites/:productId` – remove

### Pedidos (`/api/orders`)

- `POST /` – gera pedido a partir do carrinho (opcional `couponCode`)
- `GET /` – pedidos do usuário
- `GET /:id` – detalhes
- `POST /:id/cancel` – cancela pedido pendente

Webhook stubs (`/api/webhooks`) prontas para integrar com Pix e PagSeguro (adapte uso de assinaturas conforme o provedor).

### Suporte (`/api/support`)

- `POST /tickets` – público ou autenticado (necessário informar contato)
- `GET /tickets` – tickets do usuário logado

### Usuário (`/api/users`)

- `PATCH /me` – atualiza nome/telefone/preferência
- `POST /me/avatar` – upload de avatar (campo `avatar`, até 2 MB)

## Próximos passos sugeridos

- Integrar o front-end para consumir esses endpoints (substituir o uso de `localStorage` no `script.js`).
- Configurar provedor real de storage (S3, Cloudflare R2) para avatares.
- Implementar fluxo de redefinição de senha e confirmação de e-mail.
- Conectar webhooks reais dos provedores de pagamento.
- Adicionar testes automatizados (unitários e e2e) + pipeline CI.

Com isso o projeto passa a contar com uma base sólida para evoluir além do protótipo front-end. Ajuste os endpoints conforme a necessidade do front ou crie camadas adicionais (ex.: GraphQL, REST admin).
