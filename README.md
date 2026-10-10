
# 🛍️ ShopVerse — Full-Stack MERN E-Commerce Platform

A production-grade e-commerce platform built with the **MERN stack** (MongoDB, Express, React, Node.js) with **Stripe payments, Redis caching, JWT auth with refresh-token rotation, and Dockerized deployment**.

![stack](https://img.shields.io/badge/Stack-MERN-4f46e5) ![docker](https://img.shields.io/badge/Deploy-Docker-2496ed) ![stripe](https://img.shields.io/badge/Payments-Stripe-635bff)

---

## ✨ Features

### Storefront (React + Vite)
- Product catalog with **server-side pagination, filtering, sorting & fuzzy search**
- Product detail pages with reviews, ratings & related products
- Cart (localStorage-persisted) with optimistic UI
- **Stripe payment** via PaymentIntent + secure 3-D Secure card element
- Order history with **live status timeline** (Placed → Processing → Shipped → Delivered)
- User profile & address book

### Backend (Express + MongoDB)
- **JWT access (15 min) + refresh-token rotation (7 day, httpOnly cookie)** — protects against XSS & token replay
- **Stripe webhooks** for idempotent payment confirmation (handles double-charge, retries, network drops)
- **MongoDB multi-document transactions** for order creation — stock decrements atomically, never oversells
- **Redis caching** of product list queries (300s TTL, cache-invalidation on admin writes)
- **Rate limiting** (brute-force protection on auth), **Helmet** security headers, **mongo-sanitization** (NoSQL-injection defense), **Zod** input validation on every endpoint
- Aggregation-powered **admin dashboard** (revenue, top products, order funnel)
- Admin product CRUD + order status management with stock restore on cancel
- Graceful **Stripe mock mode** when no API keys are configured (runs locally with zero setup)

### DevOps
- `docker-compose up --build` → entire stack (MongoDB replica set, Redis, API, Nginx-served client)
- Health checks, `.env` driven config, seed-on-start

---

## 🏗️ Architecture

```
┌─────────────┐      HTTPS / REST      ┌──────────────────────────────────┐
│  React SPA  │ ─────────────────────► │  Node.js + Express API           │
│  (Nginx)    │  JWT access token      │  • helmet, cors, rate-limit      │
└─────────────┘                        │  • Zod validation middleware     │
        ▲                              │  • Auth (JWT + refresh rotation) │
        │ /api proxy                   │  • Product / Order / Payment     │
        │                              │    controllers + routes          │
        │                              └───┬───────────┬─────────────────┘
        │                                  │           │
        │                                  ▼           ▼
        │                          ┌──────────┐  ┌──────────┐
        └────────────── webhook ──►│ Stripe   │  │  Redis   │ (cache)
                                   └──────────┘  └──────────┘
                                        │             ▲
                                   payment status     │ cache reads/writes
                                        ▼             │
                                   ┌──────────────────┴───┐
                                   │  MongoDB (replica    │
                                   │  set — transactions) │
                                   │  • users • products  │
                                   │  • orders • reviews  │
                                   └──────────────────────┘
```

**Why a replica set?** MongoDB multi-document transactions require it — that's what guarantees
`decrement stock + create order + charge payment` either all happen or none do.

---

## 🚀 Quick Start (Docker — recommended)

```bash
git clone <your-repo> && cd shopverse
docker-compose up --build
# client → http://localhost:5173
```

Seed-on-start creates:
| Role  | Email                | Password    |
|-------|----------------------|-------------|
| Admin | admin@shopverse.dev  | Admin@123   |
| User  | user@shopverse.dev   | User@123    |

## 🔧 Local Development

```bash
# 1. Infra
docker run -d -p 27017:27017 --name mongo mongo:7   # replica set: see docker-compose
docker run -d -p 6379:6379 --name redis redis:7

# 2. API
cd server && cp .env.example .env && npm install
npm run seed && npm run dev                       # → http://localhost:5000

# 3. Client (new terminal)
cd client && npm install && npm run dev           # → http://localhost:5173
```

> **No Stripe keys?** No problem — the API auto-detects missing keys and runs in
> **mock payment mode**: orders are created and instantly marked `paid`, so the
> full checkout flow works offline. Add keys to `.env` for real charges.

## 🧪 Stripe CLI (real webhook testing)

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

---

## 🔑 Environment Variables

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection (optional — caching auto-disabled) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments |
| `CLIENT_URL` | CORS origin |
| `SEED_ON_START` | `true` to seed on boot (Docker default) |

---

## 📚 API Reference (selected)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | – | Create account (sets refresh cookie) |
| `POST` | `/api/auth/login` | – | Login (rate-limited 5/15min) |
| `POST` | `/api/auth/refresh` | cookie | Rotate refresh token, issue new access token |
| `GET` | `/api/products?category=&q=&sort=&page=` | – | Cached, paginated catalog |
| `POST` | `/api/products/:id/reviews` | user | Add review → updates avg rating atomically |
| `POST` | `/api/orders` | user | Create order **in a transaction** + Stripe PaymentIntent |
| `POST` | `/api/payments/webhook` | sig | Idempotent payment confirmation |
| `PATCH` | `/api/orders/:id/status` | admin | Advance order state machine / cancel + restore stock |
| `GET` | `/api/products/admin/stats` | admin | Revenue & top-product aggregations |

---

## 🗣️ Interview Talking Points

1. **Overselling protection** — order creation runs inside a `session.withTransaction()`;
   stock is decremented with a filter `countInStock >= qty` inside the transaction, so
   two concurrent buyers can never claim the last unit.
2. **Idempotent payments** — Stripe webhook is the *only* source of truth for
   `paymentStatus`; the client never marks itself paid. Handles retries & races.
3. **Auth hardening** — short-lived access tokens + rotating refresh tokens in
   httpOnly cookies (XSS-safe), bcrypt(12), login rate-limiting.
4. **Cache invalidation** — product-list responses cached in Redis keyed by query-hash;
   admin writes `DEL` matching keys (proper invalidation, not blind TTL).
5. **Zero-trust pricing** — order totals are computed **server-side** from DB prices;
   client-sent prices are ignored.
6. **Graceful degradation** — Stripe/Redis optional; the app runs fully without keys.

## 🧭 Roadmap
- [ ] Inventory reservation TTL (hold stock 15 min)
- [ ] Multi-device refresh-token sessions
- [ ] Elasticsearch for search
- [ ] Kubernetes manifests
