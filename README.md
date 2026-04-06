# 🛒 Product Store Backend

A production-ready **GraphQL API** for a full-featured e-commerce platform — built with Node.js, TypeScript, and a modern backend stack including authentication, payments, rate limiting, and containerization.


---

## ✨ Features

- 🔐 **JWT Authentication** via Clerk with role-based access control (Admin / User)
- 🛍️ **Product Management** — create, update, delete with ownership protection
- 🔍 **Search & Filtering** — full-text search, price range, pagination & offset
- 🛒 **Cart System** — add, remove, clear with per-user ownership validation
- 💳 **Stripe Checkout** — session creation with webhook-driven order fulfillment
- 📦 **Order Management** — automatic status updates (`pending` → `completed`) via webhooks
- 🚦 **Redis Rate Limiting** — 100 requests per 15 minutes per IP
- 🐳 **Docker** — fully containerized for consistent environments
- 🧪 **Integration Tests** — Vitest + Supertest covering auth and rate limiting
- 📉 **DB Indexes** — optimized queries on `title`, `price`, and `userId`
- 🔄 **Graceful Shutdown** — handles `SIGTERM`/`SIGINT` with connection cleanup

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| API | GraphQL Yoga |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Auth | Clerk (JWT + session claims) |
| Payments | Stripe Checkout + Webhooks |
| Cache / Rate Limit | Redis + express-rate-limit |
| Validation | Zod + drizzle-zod |
| Testing | Vitest + Supertest |
| Container | Docker + Docker Compose |
| Deploy | Railway |

---

## 🗂️ Project Structure

```
src/
├── authorization/
│   └── context.ts          # Clerk JWT verification + GraphQL context
├── config/
│   ├── env.ts              # Typed environment variables
│   └── roles.ts            # ADMIN / USER role constants
├── db/
│   ├── index.ts            # PostgreSQL pool + Drizzle client
│   ├── schema.ts           # All table definitions + relations
│   ├── validation.ts       # Zod schemas for all entities
│   └── queries/
│       ├── user.queries.ts
│       ├── product.queries.ts
│       ├── cart.queries.ts
│       └── order.queries.ts
│       └── comment.queries.ts
│       └── index.ts
├── graphql/
│   ├── resolvers/
│   │   ├── user.resolver.ts
│   │   ├── product.resolver.ts
│   │   ├── comment.resolver.ts
│   │   ├── cart.resolver.ts
│   │   └── order.resolver.ts
│   │   └── index.ts
│   └── typedefs/
│       ├── user.schema.ts
│       ├── product.schema.ts
│       ├── comment.schema.ts
│       ├── cart.schema.ts
│       └── order.schema.ts
│       └── index.ts
├── middleware/
│   └── services/
│       └── stripe.service.ts
├── __test__/
│   ├── cart.test.ts
│   └── rateLimit.test.ts
└── server.ts
```

---

## 🔒 Authorization Model

Every protected mutation verifies **authentication first**, then **authorization**:

```
Request → Clerk JWT verified → userId extracted from context
       → Ownership check (productData.userId === context.userId)
       → Admin bypass (context.role === "admin")
       → DB operation
```

| Action | Who can do it |
|--------|--------------|
| Create product | Authenticated users |
| Update product | Owner or Admin |
| Delete product | Owner or Admin |
| View cart | Cart owner only |
| Checkout | Authenticated users |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or Neon account)
- Redis
- Clerk account
- Stripe account

### 1. Clone & Install

```bash
git clone https://github.com/AhmedHawash321/product-store-backend
cd product-store-backend
npm install
```

### 2. Environment Variables

Create a `.env` file:

```env
PORT=5000
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

### 3. Push DB Schema

```bash
npm run db:push
```

### 4. Run Locally

```bash
npm run dev
```

### 5. Run with Docker

```bash
docker compose up --build
```
<img width="2174" height="1524" alt="Screenshot 2026-04-05 170706" src="https://github.com/user-attachments/assets/3a03e057-6e50-460a-88b5-1b1e4930760d" />

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run once (CI mode)
npm run test:run

# Interactive UI
npm run test:ui
```

**Test coverage includes:**
- Rate limiter — allows N requests, blocks the N+1st
- Cart total calculation logic
<img width="1452" height="1355" alt="Screenshot 2026-04-05 201203" src="https://github.com/user-attachments/assets/673eebf1-5140-4c18-a86b-7d65ec9aeb5a" />

---

## 📡 GraphQL API Examples

### Sync User (called on login)
```graphql
mutation {
  syncUser(input: {
    id: "user_xxx"
    email: "ahmed@example.com"
    name: "Ahmed"
  }) {
    id
    email
  }
}
```

### Get Products (with search + pagination)
```graphql
query {
  getProducts(limit: 10, offset: 0, filter: { search: "MacBook", minPrice: 1000 }) {
    id
    title
    price
    stock
    user { name }
  }
}
```

### Create Product (Auth required)
```graphql
mutation {
  createProduct(input: {
    title: "MacBook Pro M3"
    description: "Apple M3 Chip with 16GB RAM"
    price: 2500
    imageUrl: "https://example.com/macbook.jpg"
    stock: 10
  }) {
    id
    title
  }
}
```
<img width="2880" height="1524" alt="Screenshot 2026-04-03 1854512" src="https://github.com/user-attachments/assets/fbd4f620-12ec-4c00-bfe4-a98809c7c472" />


### Add to Cart (Auth required)
```graphql
mutation {
  addToCart(input: { productId: "uuid-here", quantity: 2 }) {
    id
    quantity
  }
}
```
<img width="2880" height="1524" alt="Screenshot 2026-04-04 154746" src="https://github.com/user-attachments/assets/f038f587-7c3e-4346-98ad-73c42199cdc1" />


### Checkout (Auth required)
```graphql
mutation {
  createCheckoutSession {
    url
  }
}
```

> **Authentication:** Pass `Authorization: Bearer <clerk_token>` in request headers.

---
## 💳 Stripe Checkout & Order Lifecycle

Every order goes through a strict state transition to ensure payment integrity, managed securely via Stripe webhooks and database transactions.

### 1. Initiate Payment (Client to API)
The user initiates checkout by calling the `createCheckoutSession` mutation. This prepares a temporary order and returns a secure Stripe Checkout URL.

```graphql
mutation {
  createCheckoutSession {
    # 🔗 Secure Stripe redirect URL for payment
    url
  }
}
```
<img width="2386" height="1372" alt="Screenshot 2026-04-05 102401" src="https://github.com/user-attachments/assets/66c6744d-4885-4eb3-9de2-9ef789be1113" />

---

## ⚙️ Stripe Webhook Flow

```
User completes payment on Stripe
        ↓
Stripe sends POST /webhook/stripe
        ↓
Backend verifies signature (STRIPE_WEBHOOK_SECRET)
        ↓
checkout.session.completed event received
        ↓
Order status updated: pending → completed
        ↓
Cart cleared automatically
```
<img width="1208" height="1225" alt="Screenshot 2026-04-05 102935" src="https://github.com/user-attachments/assets/e5c62bb5-4ac8-47db-929a-5802fa139531" />

---

## 🐳 Docker Setup

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

---

## 📊 Database Schema

```
users ──────────────────────────────────────────┐
  │                                              │
  ├──< products >──< comments                   │
  │       │                                      │
  │       └──< cartItems                         │
  │       └──< orderItems                        │
  │                                              │
  └──< orders >──< orderItems                   │
```

**Indexes:** `title_idx`, `price_idx`, `user_product_idx` for optimized filtering and search queries.

---

## 👨‍💻 Author

**Ahmed Hawash**
Backend Engineer · Node.js & Rust · Blockchain Developer

[![LinkedIn](https://www.linkedin.com/in/ahmed-hawash-21b992149/-blue)](https://www.linkedin.com/in/ahmed-hawash-21b992149/)
[![GitHub](https://img.shields.io/badge/GitHub-AhmedHawash321-black)](https://github.com/AhmedHawash321)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
