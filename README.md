# 🛍️ ShopVerse — Full-Stack MERN E-Commerce Platform

A full-stack e-commerce platform built with the **MERN stack** (MongoDB, Express, React, Node.js) with **Stripe payments, Redis caching, and JWT auth with refresh-token rotation**.

![stack](https://img.shields.io/badge/Stack-MERN-4f46e5) ![stripe](https://img.shields.io/badge/Payments-Stripe-635bff)

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

---

## 🏗️ Architecture

```
┌─────────────┐      HTTPS / REST      ┌──────────────────────────────────┐
│  React SPA  │ ─────────────────────► │  Node.js + Express API           │
│  (Vite)     │  JWT access token      │  • helmet, cors, rate-limit      │
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
`decrement stock + create order + charge payment` either all happen or none do. MongoDB Atlas clusters are replica sets by default.

---

## 🔧 Getting Started

**Requirements:** Node.js 18+ and a MongoDB replica set (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works). Redis is optional.

```bash
# 1. API
cd server
cp .env.example .env       # then set MONGO_URI (and JWT secrets) in .env
npm install
npm run seed
npm run dev                # → http://localhost:5000

# 2. Client (new terminal)
cd client
npm install
npm run dev                # → http://localhost:5173
```

Seeded accounts:

| Role  | Email                | Password    |
|-------|----------------------|-------------|
| Admin | admin@shopverse.dev  | Admin@123   |
| User  | user@shopverse.dev   | User@123    |

> **No Stripe keys?** No problem — the API auto-detects missing keys and runs in
> **mock payment mode**: orders are created and instantly marked `paid`, so the
> full checkout flow works offline. Add keys to `.env` for real charges.

### Stripe CLI (optional, for real webhook testing)

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
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payments (optional) |
| `CLIENT_URL` | CORS origin |
| `SEED_ON_START` | `true` to seed the database on boot |

---

## 📚 API Reference (selected)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account (sets refresh cookie) |
| POST | `/api/auth/login` | – | Login (rate-limited 5/15min) |
| POST | `/api/auth/refresh` | cookie | Rotate refresh token, issue new access token |
| GET | `/api/products?category=&q=&sort=&page=` | – | Cached, paginated catalog |
| POST | `/api/products/:id/reviews` | user | Add review → updates avg rating atomically |
| POST | `/api/orders` | user | Create order in a transaction + Stripe PaymentIntent |
| POST | `/api/payments/webhook` | sig | Idempotent payment confirmation |
| PATCH | `/api/orders/:id/status` | admin | Advance order state machine / cancel + restore stock |
| GET | `/api/products/admin/stats` | admin | Revenue & top-product aggregations |

---

## 🧭 Roadmap

- [ ] Inventory reservation TTL (hold stock 15 min)
- [ ] Multi-device refresh-token sessions
- [ ] Elasticsearch for search
