# SocialBoost AI

AI-powered social content for Instagram, YouTube and Facebook. Upload an image or video, set a short brief (format, tone, audience, goal), and Google Gemini analyses the media and writes platform-ready hooks, captions, titles, descriptions, hashtags, keywords, CTAs and thumbnail text. Users can edit, regenerate in another tone, preview the post, copy, save to a library and browse their history.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, Vite 8, React Router 7, Tailwind CSS 4, Framer Motion, Lucide icons, Sonner toasts, Axios |
| Backend  | Node 20+, Express 4, MongoDB + Mongoose 8, JWT auth, Multer → Cloudinary, Google Gemini (`@google/genai`) |
| Security | Helmet, CORS allow-list, rate limiting (auth, AI, global), express-validator, bcrypt (12 rounds) |
| Tests    | `node:test` + Supertest + mongodb-memory-server (Cloudinary and Gemini are stubbed) |

## Quick start

Prerequisites: Node.js 20+, a MongoDB database (local or Atlas), a [Gemini API key](https://aistudio.google.com/apikey) and a [Cloudinary](https://cloudinary.com) account.

```powershell
npm run install:all                               # root + backend + frontend deps
Copy-Item backend/.env.example backend/.env       # then fill in the values
Copy-Item frontend/.env.example frontend/.env
npm run dev                                       # API on :5000, web app on :5173
```

`npm run seed --prefix backend` optionally upserts the default platform records.

## Scripts (from the repo root)

| Command | What it does |
|---|---|
| `npm run dev` | Backend (auto-restart) and frontend dev servers together |
| `npm test` | Backend API test suite (in-memory MongoDB, no external calls) |
| `npm run lint` | ESLint over the frontend |
| `npm run build` | Production build of the frontend into `frontend/dist` |
| `npm start` | Start the backend in production mode |
| `npm run check` | Lint + tests + build — run before every deploy |

## Environment variables

**Backend (`backend/.env`)** — the server refuses to start if a required value is missing.

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URI` | yes | `MONGODB_URI` is also accepted |
| `JWT_SECRET` | yes | 32+ random characters in production |
| `CLIENT_URL` | prod | Comma-separated allowed origins, e.g. `https://app.example.com` |
| `GEMINI_API_KEY` | prod | |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | prod | The cloud name is the lowercase ID on your Cloudinary dashboard |
| `NODE_ENV` | prod | Set to `production` |
| `TRUST_PROXY` | behind a proxy | Usually `1` on Render, Railway, Heroku or behind Nginx, so rate limits see real client IPs |
| `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`, `JWT_EXPIRES_IN`, `CLOUDINARY_FOLDER`, `RATE_LIMIT_*` | no | See `backend/.env.example` for defaults |

**Frontend (`frontend/.env`)**: `VITE_API_URL` — the backend's `/api` base URL, baked in at build time.

## Project structure

```
backend/
  app.js            Express app (middleware, routes, error handling) — imported by tests
  server.js         Connects to MongoDB, starts HTTP server, graceful shutdown
  config/           env validation, db, cloudinary, gemini client
  middleware/       auth (JWT), upload (multer), validate, rateLimit, errorHandler
  models/           User, Media, MediaAnalysis, Content, ContentHistory, SavedContent, Platform
  routes/           auth, media, content, saved, history
  services/         aiService (Gemini), cleanup (cascading deletes)
  utils/            prompts + response schema, constants, pagination, HttpError
  tests/            API tests
frontend/src/
  pages/            Home, Login, Register, Dashboard, Generate, Result, Saved, History, Settings, NotFound
  components/       layout/ (app shell, public, auth), ui/ (Button, Field, Modal, Menu…), generate/, result/, home/
  context/          AuthContext, ThemeContext
  api/axios.js      API client, session-expiry handling, error messages
  lib/              constants, formatting, Cloudinary thumbnail helpers
```

## API

All routes except register/login require `Authorization: Bearer <token>`. Errors are JSON `{ message, errors? }`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` → `{ token, user }` (password: 8+ chars, a letter and a number) |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| GET / PATCH / DELETE | `/api/auth/me` | Profile · update name · delete account (`{ password }`, removes all data) |
| PUT | `/api/auth/password` | `{ currentPassword, newPassword }` → new token; older tokens are revoked |
| POST | `/api/media/upload` | Multipart field `media`, image/video ≤ 50MB |
| GET / DELETE | `/api/media`, `/api/media/:id` | List / get / delete own media |
| POST | `/api/content/generate` | `{ mediaId, platform, contentType, audience?, tone?, goal? }` |
| GET | `/api/content?page&limit&platform&q` | Paginated, filterable list |
| GET | `/api/content/stats` | Totals, last 7 days, saved count, per-platform counts |
| GET / PUT / DELETE | `/api/content/:id` | Get (with analysis + `savedId`) · edit · delete (cascades) |
| POST | `/api/content/:id/regenerate` | New version, optionally with `{ tone, … }` overrides |
| GET | `/api/history?page&limit` | Activity feed |
| POST / GET / DELETE | `/api/saved`, `/api/saved/:id` | Save (idempotent) · list · remove |
| GET | `/health`, `/api/health` | Liveness + DB status (503 when the DB is down) |

## Deploying

1. Run `npm run check`.
2. **Backend** (Render, Railway, Fly, a VM…): root `backend/`, build `npm ci`, start `npm start`. Set `NODE_ENV=production`, `TRUST_PROXY=1` and all required variables. Health check path: `/health`.
3. **Frontend** (Vercel, Netlify, Cloudflare Pages…): root `frontend/`, build `npm run build`, output `dist`. Set `VITE_API_URL` before building. SPA rewrites are included (`vercel.json`, `public/_redirects`).
4. Add the frontend's URL to the backend's `CLIENT_URL`.

## Troubleshooting

- **"Upload failed" / `Invalid cloud_name` in the server log** — `CLOUDINARY_CLOUD_NAME` must be the cloud name from your Cloudinary dashboard, not a display name.
- **"AI generation is not configured"** — `GEMINI_API_KEY` is missing.
- **CORS errors in the browser** — the frontend origin is not listed in `CLIENT_URL`.
