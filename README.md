# नवभारत 24x7 — Hindi + English news portal (MERN + Redux Toolkit)

MongoDB · Express · React · Node, with Redux Toolkit for client state.

## Run it locally

Requires Node 20+ and a MongoDB (local, or a MongoDB Atlas connection string).

```bash
npm install
cp server/.env.example server/.env    # set MONGODB_URI (see the comments in the file)
npm run setup                         # creates the admin account + categories (deletes nothing)
npm run dev                           # API :5001 + web :5173
```

Open http://localhost:5173.

Want demo stories? On an **empty** database run `npm run seed` (31 fictional stories, Hindi + English). It refuses to run if articles already exist; replacing them needs `npm run seed -w server -- --force`.

## Environment (`server/.env`)

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | **yes** | Your MongoDB connection string. The server will not start without it. |
| `JWT_SECRET` | production | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for `setup` | First admin login. In production choose a strong password (min. 8 chars); if empty, `setup` prints a random one once. |
| `CLIENT_ORIGIN` | if site and API are on different domains | Comma-separated list, e.g. `https://your-site.netlify.app` |
| `PORT`, `JWT_EXPIRES_IN` | no | Defaults `5001`, `7d` |
| `AUTO_SEED` | no | `true` = fill an empty DB with the sample stories on start. Not for a real site. |
| `DEV_SIMPLE_ADMIN` | no | **Local only**: allows login ID `admin` with a short password. Ignored when `NODE_ENV=production`. |

## Go live (server and client separately)

Server (API) → **Render**. Client (React site) → **Netlify**. MongoDB → **Atlas**.

### 1. MongoDB Atlas
*Database Access*: a user with read/write → *Network Access*: allow `0.0.0.0/0` (Render's IPs change) → *Connect → Drivers* and copy the string. Put the real password in and add the database name before the `?`:

`mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/navbharat24x7?appName=Cluster0`

If the password has special characters (`@ : / # ?`), URL-encode them (`@` → `%40`).

### 2. Server on Render
*New + → Blueprint* → pick this repo (it reads `render.yaml`). Render asks for:
- `MONGODB_URI` — the Atlas string
- `CLIENT_ORIGIN` — your Netlify URL (enter a placeholder now, correct it after step 4)

(`JWT_SECRET` is generated for you.) Then open `https://<service>.onrender.com/api/health` → `{"ok":true,"db":"connected"}`.
Without a Blueprint: *New + → Web Service*, build `npm install -w server`, start `npm start`, plus `NODE_ENV=production` and the variables above.

### 3. Create the admin login and categories (once)
The Atlas database is empty. On your computer, in `server/.env` set the real `MONGODB_URI` and a strong `ADMIN_PASSWORD` (min. 8 characters), then:

```bash
npm run setup
```

It creates the admin (`admin@navbharat.local`, or your `ADMIN_EMAIL`) and the 11 categories. Safe to run again; it deletes nothing. Do **not** run `npm run seed` on the live database (that is for fictional demo stories).

### 4. Client on Netlify
*Add new site → Import from Git* → this repo (`netlify.toml` has the build settings). Add the environment variable
`VITE_API_URL = https://<your-render-service>.onrender.com/api` and deploy. Then go back to Render and set `CLIENT_ORIGIN` to the Netlify URL (no trailing slash needed) — otherwise the browser blocks the API responses.

### Before you announce it
- Log in on the site with the admin from step 3 and publish your first stories (Hindi, plus English if you want).
- Never set `DEV_SIMPLE_ADMIN` on a server (it is also ignored for non-local databases).
- Free Render instances sleep when idle: the first visit after a pause takes about a minute.

## Features

- Editorial homepage: hero, 3 side stories, latest, trending, per-category sections, spotlight, auto-rotating breaking ticker; the page refreshes itself every 60 s and the ticker every 45 s (a new breaking story jumps to the front)
- Category pages with "show more", full search page, search-as-you-type overlay (debounced, race-safe)
- Article page: reading time, views, share (copies the link; native share sheet on phones), save, related stories, comments
- Auth (JWT): register / login / session restore; saved stories per user; comments (own, or editor/admin can delete)
- Editorial panel (`editor` / `admin`): stats, list with status filter + search + paging, create / edit / delete, draft vs published, breaking / featured flags, Hindi + English versions
- **Hindi + English**: Hindi is the default; the switch is in the top bar (and the mobile drawer) and is remembered in the browser. It changes the whole UI, dates/numbers, category names, stories, search suggestions and server error messages. A story without an English version falls back to Hindi with a small notice.
- Responsive (phone, tablet, desktop; mobile drawer nav), newspaper typography (Playfair Display + Martel for headlines, DM Sans + Mukta for text), image fallback tiles

## Languages

- **UI text:** Hindi is the source language. In code write `t('होम')`; the English text lives in `client/src/i18n/en.js`. Module-level constants use `msgid('…')`. `npm run i18n:check -w client` (also run by `npm run build`) fails on a missing English entry or Devanagari text left outside `t()`.
- **Content:** Hindi fields are the base; an optional `en` block on each article (title, summary, body, image description, tags) and `nameEn` on each category hold the English version. The editorial panel has both forms. English needs title + summary + body together.
- **API:** every request carries `?lang=hi|en` (default `hi`); the server returns localised content and messages. Search matches both languages.

## Structure

```
server/src
  config/       env (validated at start) + Mongo connection
  models/       User, Category, Article, Comment (Mongoose)
  controllers/  auth, article, category, comment, bookmark
  middleware/   auth (protect / restrictTo / optionalAuth), error handler
  routes/       /api router
  utils/        i18n (server messages), localize (content), slug, HttpError
  seed/         sample data, `setup` (admin + categories), `seed` (sample stories)
client/src
  app/          store, apiThunk helper
  features/     Redux slices: auth, articles, categories, bookmarks, comments, admin, ui
  i18n/         t()/useI18n, language state, en.js dictionary
  components/   layout, cards, buttons, feedback
  pages/        Home, Category, Search, Article, Login/Register, Bookmarks, Admin, ArticleEditor
  styles/       base.css (original design), app.css (components + typography)
client/scripts/check-i18n.mjs
render.yaml · netlify.toml
```

## API

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/health` | public (503 if MongoDB is unreachable) |
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

All endpoints accept `?lang=hi|en`.

## Notes

- Public sign-ups are always the `user` role; editors/admins are set in the database.
- Search uses escaped case-insensitive regex over title, summary, tags and author in both languages — fine for thousands of articles; move to Atlas Search / a text index if the archive grows large.
- Images are hot-linked (the sample stories use Unsplash / picsum); the editor takes an image URL rather than handling uploads.
- Sample stories are fictional.
