# Deployment (free tier)

This stack is split into three deployable units: **API** (Render/Railway), **public site** (Vercel/Netlify), **admin** (second Vercel/Netlify project or path). The database is **MongoDB Atlas M0**.

## MongoDB Atlas

1. Create a free cluster (region close to your API region).
2. Database Access: add a user with read/write to the target database.
3. Network Access: allow `0.0.0.0/0` for hobby projects, or restrict to Render/Vercel egress if you maintain IP lists.
4. Connect string: use **Drivers** → Node.js → SRV string as `MONGODB_URI` in the API `.env`.
5. **Text search**: the API uses a MongoDB text index on `posts` (`title`, `excerpt`, `tags`). After first deploy, confirm the index exists (Mongoose creates it from the schema). In Atlas, browse **Collections → indexes** for collection `posts`.

## First administrator

There is no separate admin signup. Flow:

1. Register a normal user on the **public** frontend (`/register`).
2. In Atlas (or `mongosh`), set that user’s `role` to `admin`:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

3. Sign in on the **admin** app with the same credentials.

## Backend (Render example)

1. New **Web Service**, connect this repo, **root directory** `backend`.
2. **Build command:** `npm install && npm run build`
3. **Start command:** `node dist/index.js`
4. Set environment variables from `backend/.env.example` (production values, long random `JWT_*` secrets, Atlas URI, `CLIENT_ORIGIN` and `ADMIN_ORIGIN` as full HTTPS URLs of the two frontends).
5. **Cold starts:** the health check path is `/health`. The public UI shows a short “Connecting to API…” state on first paint; RTK Query retries 401s via refresh.
6. **Connection pool:** `MONGODB_MAX_POOL_SIZE=5` is appropriate for Atlas M0 and a single small web dyno.

### Railway

Same commands; set variables in the service dashboard. Prefer one process per service (no workers).

## Cloudinary (optional image upload)

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` on the API. Without them, `POST /api/upload/image` returns **503** and the editor still works with manual image URLs.

**Firebase Storage:** not wired in this repo; you could replace `routes/upload.ts` with a signed-URL flow to keep the API stateless on the free tier.

## Public frontend (Vercel)

1. New project, **root directory** `frontend`.
2. Framework: Vite. **Build:** `npm run build`, **Output:** `dist`.
3. Environment: `VITE_API_URL=https://your-api.onrender.com` (no trailing slash).
4. CORS: the API must list this site’s origin in `CLIENT_ORIGIN`.

`vercel.json` and `public/_redirects` enable SPA routing.

## Admin frontend (Vercel / Netlify)

1. Second project, **root directory** `admin-panel`.
2. `VITE_API_URL` same as public site.
3. Add the admin site’s origin to `ADMIN_ORIGIN` on the API (CORS).

## Netlify (alternative to Vercel)

Same build settings; `_redirects` in `frontend/public` is already present. Set `VITE_API_URL` under **Site settings → Environment variables**.

## CORS and cookies (refresh token)

- Refresh token cookie uses `SameSite=None; Secure` in production so a **different-origin** SPA can call `POST /api/auth/refresh` with `credentials: "include"`.
- Both frontends must use **HTTPS** in production.
- `CLIENT_ORIGIN` / `ADMIN_ORIGIN` must match the exact browser origins (scheme + host + port if any).

## Local development

Three terminals:

```bash
cd backend && cp .env.example .env   # fill secrets + MONGODB_URI
npm install && npm run dev
```

```bash
cd frontend && cp .env.example .env.local
npm install && npm run dev
```

```bash
cd admin-panel && cp .env.example .env.local
npm install && npm run dev
```

Use `VITE_API_URL=http://localhost:4000` in both frontends. Set `CLIENT_ORIGIN=http://localhost:5173` and `ADMIN_ORIGIN=http://localhost:5174` in the API `.env`.
