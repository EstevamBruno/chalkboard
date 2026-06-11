# Chalkboard

A fullstack platform where a teacher creates a **class** — a shared whiteboard — and
everyone with the board open sees edits **live**. Draw free-hand, add geometric shapes,
or type text; every stroke syncs in real time.

Built with **Next.js (App Router)** + **shadcn-style UI** + **MySQL (Prisma)**, with a
custom Node server hosting **Socket.IO** for real-time board sync.

## Features

- Email/password registration and **bearer-token (JWT)** auth.
- Any user can create a class; each class has a unique opaque ID for listing and linking.
- Owners can **invite** existing users by email; invitees accept/decline from their dashboard.
- Per-class **real-time board**: pen, line, rectangle, ellipse, text, eraser, and clear —
  broadcast to every connected member; late joiners receive the full snapshot.

## Tech stack

| Layer       | Choice                                              |
| ----------- | --------------------------------------------------- |
| Framework   | Next.js 14 (App Router) + custom Node server        |
| UI          | React, Tailwind CSS, shadcn-style components, Radix |
| Fonts       | Fraunces (display), Hanken Grotesk (body), Caveat (hand) |
| Database    | MySQL via Prisma                                    |
| Auth        | JWT bearer tokens, bcryptjs hashing                 |
| Real-time   | Socket.IO (one room per class)                      |

## Prerequisites

- Node.js 18+ (developed on Node 24)
- A running **MySQL 8** instance

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment** — copy the example and adjust:

   ```bash
   cp .env.example .env
   ```

   | Variable        | Description                                  |
   | --------------- | -------------------------------------------- |
   | `DATABASE_URL`  | MySQL connection string used by Prisma       |
   | `JWT_SECRET`    | Secret used to sign bearer tokens            |
   | `JWT_EXPIRES_IN`| Token lifetime (e.g. `7d`)                   |
   | `PORT`          | Port for the combined Next.js + Socket.IO server |

3. **Create the database** (once):

   ```bash
   mysql -uroot -e "CREATE DATABASE IF NOT EXISTS chalkboard CHARACTER SET utf8mb4;"
   ```

4. **Run migrations + generate the Prisma client**

   ```bash
   npx prisma migrate dev
   ```

## Running

```bash
npm run dev     # dev server (Next.js + Socket.IO) with hot reload via tsx
npm run build   # prisma generate + next build
npm run start   # production server
```

Open <http://localhost:3000>. Register two accounts in separate browsers, have the owner
create a class and invite the other, then open the board in both windows to watch edits
sync live.

## Architecture notes

- **Custom server** (`server.ts`): Next.js request handler and the Socket.IO server share a
  single HTTP server. Next.js serverless API routes can't hold persistent sockets, so a
  long-lived Node process hosts both. Deploy as a container / VM (not Vercel serverless).
- **Auth**: REST routes read `Authorization: Bearer <token>`; the socket handshake passes the
  same token in `auth.token`. Both resolve the user via `src/lib/auth.ts`.
- **Board model**: a board is an ordered list of `BoardElement` rows keyed by `classId`
  (`stroke | rect | ellipse | line | text`, with JSON `data`). On join the client fetches the
  full snapshot over REST, then subscribes to live ops. Conflict policy is **last-write-wins**
  per element.
- **Real-time flow**: client emits `board:op` → server validates membership + the op
  (`src/lib/board.ts` zod schemas), persists via Prisma (`src/server/board-store.ts`), then
  broadcasts to `class:<id>`. Drawing emits are throttled (~70 ms) with ack-based backpressure.

## Project layout

```
server.ts                       # Next.js + Socket.IO custom server
prisma/schema.prisma            # User, Class, Membership, Invitation, BoardElement
src/
  app/
    api/                        # REST: auth, classes, invitations, board
    page.tsx login/ register/ dashboard/ class/[id]/
  components/
    ui/                         # button, input, label, card, dialog
    board/                      # canvas, toolbar, invite-dialog, use-board hook
    auth-provider.tsx auth-shell.tsx
  lib/                          # prisma, auth, authz, http, board (zod), api client
  server/                       # socket.ts, board-store.ts
```

## API summary

| Method | Path                                  | Auth        | Purpose                          |
| ------ | ------------------------------------- | ----------- | -------------------------------- |
| POST   | `/api/auth/register`                  | —           | Create account, returns token    |
| POST   | `/api/auth/login`                     | —           | Login, returns token             |
| GET    | `/api/auth/me`                        | bearer      | Current user                     |
| POST   | `/api/classes`                        | bearer      | Create a class                   |
| GET    | `/api/classes`                        | bearer      | List my classes                  |
| GET    | `/api/classes/:id`                    | member      | Class details + members          |
| POST   | `/api/classes/:id/invitations`        | owner       | Invite a user by email           |
| GET    | `/api/classes/:id/board`              | member      | Full board snapshot              |
| GET    | `/api/invitations`                    | bearer      | My pending invitations           |
| POST   | `/api/invitations/:id/accept`         | invitee     | Accept (join class)              |
| POST   | `/api/invitations/:id/decline`        | invitee     | Decline                          |

**Socket.IO** (`path: /api/socket`): `subscribe(classId)`, `unsubscribe(classId)`,
`board:op({ classId, op })`; server emits `board:op` to other room members.
