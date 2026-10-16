# SprintBoard

A small sprint-planning app. Sign up, create boards, and track tasks across
three status columns (To Do, In Progress, Done).

Built with the Next.js App Router, MongoDB/Mongoose, and Tailwind CSS.

## Features

- Email + password accounts (bcrypt-hashed passwords, MongoDB-backed sessions).
- Cookie-based sessions (`HttpOnly`, `SameSite=Lax`, `Secure` in production).
- Per-account boards with edit and delete (deletes cascade to the board's tasks).
- Task create/edit/delete with status and priority, and inline status/priority
  changes on each task card.
- Login rate limiting (per IP and per email).
- Health check at `GET /api/health`.

## Tech stack

- **Next.js 16** (App Router, Turbopack, Cache Components, Server Components)
- **React 19**
- **MongoDB** via **Mongoose 9**
- **Tailwind CSS v4**
- **bcrypt** for password hashing
- `node:test` for unit tests

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` with a MongoDB connection string (see `.env.example`):

   ```bash
   MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority"
   ```

   `.env.local` is gitignored. Never commit real credentials.

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                        |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start the development server       |
| `npm run build` | Create an optimized production build |
| `npm start`     | Run the production build           |
| `npm run lint`  | Lint with ESLint                   |
| `npm test`      | Run the unit tests (`node --test`) |

## Project structure

```
src/
  app/            Route handlers (API) and pages
    (auth)/       Login and register pages
    api/          REST endpoints (auth, boards, tasks, health)
    dashboard/    Dashboard and board detail pages
  components/     UI components (ui/, auth/, boards/, dashboard/)
  lib/            Server helpers (auth, boards, api clients, db)
  models/         Mongoose models (User, Session, Board, Task)
  proxy.js        Middleware: redirects unauthenticated /dashboard requests
tests/            Unit tests
```

## API overview

All board and task endpoints require a valid session cookie. Ownership is
derived from the session on the server; client-supplied `owner`/`board` fields
are ignored.

| Method | Path                                        | Purpose                    |
| ------ | ------------------------------------------- | -------------------------- |
| POST   | `/api/auth/register`                        | Create an account          |
| POST   | `/api/auth/login`                           | Sign in (sets session)     |
| POST   | `/api/auth/logout`                          | Sign out and clear session |
| GET    | `/api/auth/me`                              | Current user               |
| GET    | `/api/health`                               | Health / DB ping           |
| GET    | `/api/boards`                               | List your boards           |
| POST   | `/api/boards`                               | Create a board             |
| GET    | `/api/boards/:boardId`                      | Board + its tasks          |
| PATCH  | `/api/boards/:boardId`                      | Update a board             |
| DELETE | `/api/boards/:boardId`                      | Delete a board (and tasks) |
| GET    | `/api/boards/:boardId/tasks`                | List tasks                 |
| POST   | `/api/boards/:boardId/tasks`                | Create a task              |
| GET    | `/api/boards/:boardId/tasks/:taskId`        | Get a task                 |
| PATCH  | `/api/boards/:boardId/tasks/:taskId`        | Update a task              |
| DELETE | `/api/boards/:boardId/tasks/:taskId`        | Delete a task              |

## Deployment checklist

1. Set `MONGODB_URI` in the hosting provider's environment variables (e.g. a
   MongoDB Atlas connection string with a least-privilege database user). Do not
   commit it.
2. Build and start: `npm run build && npm start`. On Vercel this is automatic.
3. Ensure the app is served over HTTPS so the `Secure` session cookie is sent.
4. Add `NODE_ENV=production` in production (this is the default for `next start`
   and Vercel) so session cookies are marked `Secure`.
5. Verify the deploy with `GET /api/health` (expect `{"status":"ok","database":"ok"}`).
6. Allow the host's outbound IPs in MongoDB Atlas network access.

### Known limitations

- Login rate limiting uses an in-memory store, so it is per-process and resets
  on restart/cold start. For multi-instance or serverless deployments, back it
  with a shared store (e.g. Redis) if strict global limits are required.
- Sessions are stored in MongoDB; the `expiresAt` TTL index requires the TTL
  monitor to be enabled on the cluster (enabled by default on Atlas).
- The middleware only checks for the presence of a session cookie (an
  optimistic check). Full authentication and ownership are enforced on the
  server for every API request.
