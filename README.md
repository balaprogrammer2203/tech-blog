# Tech blog (Medium-style, free-tier oriented)

Monorepo layout:

| Folder         | Stack                                      | Role                                      |
| -------------- | ------------------------------------------ | ----------------------------------------- |
| `backend/`     | Node 20+, Express, Mongoose, JWT, Zod      | REST API, Cloudinary upload, rate limits  |
| `frontend/`    | Vite, React 18, RTK Query, Tailwind        | Public reader + authoring for signed-in users |
| `admin-panel/` | Vite, React 18, MUI, RTK Query              | Lightweight moderation (posts, users, reports) |

Design goals: **small payloads**, **pagination**, **shallow Mongoose population**, **short-lived access JWT** with **refresh cookie** + **hashed refresh** in MongoDB, **optional in-memory TTL cache** for published post-by-slug, **no background workers**.

## Quick start

See **local development** in [DEPLOYMENT.md](./DEPLOYMENT.md).

**Dummy data:** from `backend/`, with `MONGODB_URI` set, run `npm run seed`. It wipes `users`, `categories`, `posts`, `comments`, `likes`, `bookmarks`, and `reports`, then inserts a small **two-level tech/programming** category tree plus sample posts (each published post has a leaf category). Log in as `admin@seed.local` or `user@seed.local` with password `password123`.

**Swagger:** with the API running, open [http://localhost:4000/api-docs](http://localhost:4000/api-docs) (adjust host/port). Raw OpenAPI JSON: `/openapi.json`.

## API overview (selected)

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/api/auth/register` | Email/password |
| POST | `/api/auth/login` | Sets `httpOnly` refresh cookie |
| POST | `/api/auth/refresh` | Rotates refresh, returns new access token |
| POST | `/api/auth/logout` | Clears refresh hash (auth required) |
| GET | `/api/auth/me` | Optional auth: returns user or null |
| GET | `/api/categories` | Two-level category tree (`roots[]` with `children[]`) |
| GET | `/api/posts` | Published list; `?category=` leaf id or `?categorySlug=` leaf slug; `?q=` text search |
| GET | `/api/posts/slug/:slug` | Published article |
| GET | `/api/posts/:id` | Published or own draft (optional auth) |
| GET | `/api/posts/mine` | Auth: paginated drafts + published |
| POST/PATCH/DELETE | `/api/posts` … | Author CRUD |
| GET/POST | `/api/posts/:postId/comments` | Max reply depth 2 |
| GET/POST | `/api/posts/:postId/likes` | Toggle like |
| GET/POST | `/api/bookmarks` … | Bookmarks |
| POST | `/api/reports` | Authenticated report |
| GET/PATCH | `/api/reports/admin` … | Admin queue |
| GET/PATCH/DELETE | `/api/admin/users` … | Admin users + posts |
| POST | `/api/upload/image` | Multipart `file` → Cloudinary |

## Production checklist

- [ ] Long random `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (32+ chars each).
- [ ] Atlas user + network rules.
- [ ] `CLIENT_ORIGIN` / `ADMIN_ORIGIN` match deployed HTTPS URLs.
- [ ] Promote first user to `admin` in MongoDB (see [DEPLOYMENT.md](./DEPLOYMENT.md)).
- [ ] Cloudinary env vars if using cover uploads.
