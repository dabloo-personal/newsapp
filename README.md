# नवभारत 24x7 — Hindi news portal (MERN + Redux Toolkit)

MongoDB · Express · React · Node, with Redux Toolkit for client state.

## Run it

Requires Node 20+. With `MONGODB_URI` empty the app uses an embedded database and seeds itself; to use a local MongoDB set `MONGODB_URI=mongodb://127.0.0.1:27017/navbharat24x7` and run `npm run seed` once.

```bash
npm install
cp server/.env.example server/.env   # see comments in the file
npm run dev                          # API :5001 + web :5173
```

Open http://localhost:5173.

Admin login (created by the seed, change it in `server/.env` before seeding): `admin@navbharat.local` / `Admin@12345`

## Deploy

One Node service serves both the React build and the API from a single URL.

| Setting | Value |
| --- | --- |
| Build command | `npm install --include=dev && npm run build` |
| Start command | `npm start` |
| Environment | `NODE_ENV=production` (and `PORT` if the host doesn't set it) |
| Host type | A long-running Node host: Render, Railway, Fly.io, a VPS. **Not** serverless (Vercel/Netlify functions). |

### No MongoDB connection string yet?

Deploy anyway — leave `MONGODB_URI` unset. The app then runs an **embedded MongoDB** inside the server process and seeds it with the sample stories, so the whole site works (browse, search, EN/HI, login, comments, editorial panel).

- Data is **temporary**: every restart/redeploy wipes accounts, comments, saved stories and edits and re-seeds.
  To keep data without a connection string, mount a persistent disk and set `EMBEDDED_DB_PATH=/path/on/disk`.
- First start downloads the MongoDB binary (~77 MB) and uses roughly 200–300 MB RAM — check your plan's limits.
- In production there is no default admin password. Leave `ADMIN_PASSWORD` empty and read the generated one in the server log at first start (`Admin created: … password: …`), or set `ADMIN_PASSWORD` yourself.
- `JWT_SECRET` is optional in this mode (a random one is used, so logins end on restart). Setting it is still good practice.
- `GET /api/health` shows which database is active: `{"ok":true,"db":"embedded"}`.

### When you have a connection string

1. Set `MONGODB_URI` (e.g. your MongoDB Atlas URL) and a real `JWT_SECRET`. Redeploy.
2. The database starts empty. Either set `AUTO_SEED=true` once (seeds the sample content + admin when there are no categories), or run `npm run seed` locally with the same `MONGODB_URI`. Then remove `AUTO_SEED`.
3. `/api/health` now reports `"db":"mongodb"`. Nothing else changes; data from the embedded database is not migrated (it was demo data).

Atlas tip: allow your host's outbound IPs (or `0.0.0.0/0` while testing) under Network Access.

> Seed content is fictional sample text. `npm run seed` (needs `MONGODB_URI`) resets articles, categories and comments; users are kept.

## Features

- Editorial homepage: hero, ticker (auto-rotating, refreshed every 45 s), latest, trending, per-category sections, spotlight
- Category pages with "load more", full search page, search-as-you-type overlay (debounced, race-safe)
- Article page: reading time, views, share, bookmark, related stories, comments
- Auth (JWT): register / login / session restore; bookmarks per user; comments (own or editor/admin can delete)
- Editorial panel (`editor` / `admin` roles): stats, list with status filter + search, create / edit / delete, draft vs published, breaking / featured flags
- **Hindi + English**: Hindi is the default; the switch is in the top bar (and the mobile drawer) and is remembered in the browser. It changes the whole UI, dates/numbers, category names, stories, search suggestions and server error messages. A story without an English version falls back to Hindi with a small notice.
- Responsive (phone, tablet, desktop; mobile drawer nav), Hindi typography, image fallback tiles

## Languages

- **UI text:** Hindi is the source language. In code write `t('होम')`; the English text lives in `client/src/i18n/en.js`. Module-level constants use `msgid('…')`. `npm run i18n:check -w client` (also part of `npm run build`) fails on a missing English entry or Devanagari text left outside `t()`.
- **Content:** Hindi fields are the base; an optional `en` block on each article (title, summary, body, image description, tags) and `nameEn` on each category hold the English version. The editorial panel has both forms. English needs title + summary + body together.
- **API:** every request carries `?lang=hi|en` (default `hi`); the server returns localised content and messages. Search matches both languages.

## Structure

```
server/src
  config/       env + Mongo connection
  models/       User, Category, Article, Comment (Mongoose)
  controllers/  auth, article, category, comment, bookmark
  middleware/   auth (protect / restrictTo / optionalAuth), error handler
  routes/       /api router
  seed/         sample data + seed script
client/src
  app/          store, apiThunk helper
  features/     Redux slices: auth, articles, categories, bookmarks, comments, admin, ui
  components/   layout, cards, buttons, feedback
  pages/        Home, Category, Search, Article, Login/Register, Bookmarks, Admin, ArticleEditor
```

## API

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | public (rate-limited) |
| GET | `/api/auth/me` | user |
| GET | `/api/categories` | public |
| GET | `/api/articles?category=&q=&page=&limit=&breaking=&sort=popular` | public |
| GET | `/api/articles/home` | public (whole homepage in one request) |
| GET | `/api/articles/:slug` | public (drafts visible to staff) |
| GET | `/api/articles/admin/{stats,list,:id}` | editor / admin |
| POST / PUT / DELETE | `/api/articles[/:id]` | editor / admin |
| GET / POST / DELETE | `/api/comments/:articleId`, `/api/comments/item/:id` | read: public · write: user |
| GET / POST | `/api/bookmarks`, `/api/bookmarks/:articleId` (toggle) | user |

## Notes

- Public sign-ups are always the `user` role; editors/admins are set in the database.
- Search uses escaped case-insensitive regex over title, summary, tags and author — fine for thousands of articles; switch to an Atlas Search / text index if the archive grows large.
- Reader-facing images are hot-linked (Unsplash / picsum in the seed); the editor takes an image URL rather than handling uploads.
