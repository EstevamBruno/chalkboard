## 1. Project setup

- [x] 1.1 Scaffold Next.js (App Router, TypeScript) app and initialize git
- [x] 1.2 Add Tailwind CSS and initialize shadcn/ui; add base components (button, input, dialog, card, toast)
- [x] 1.3 Add dependencies: prisma + @prisma/client, mysql2, bcrypt, jsonwebtoken, socket.io, socket.io-client, zod, cuid/nanoid
- [x] 1.4 Add `.env` with `DATABASE_URL` (MySQL) and `JWT_SECRET`; document required env vars in README

## 2. Database & data model

- [x] 2.1 Init Prisma; define `User`, `Class`, `Membership`, `Invitation`, `BoardElement` models per design.md
- [x] 2.2 Add unique constraints (User.email, Class.id opaque, unique membership per user+class, unique pending invitation per user+class)
- [x] 2.3 Create and run initial migration against MySQL
- [x] 2.4 Add a Prisma client singleton module for reuse across API routes

## 3. Auth (REST) — user-auth spec

- [x] 3.1 Implement bcrypt hash/verify helpers and JWT sign/verify helpers
- [x] 3.2 `POST /api/auth/register` — validate (zod) email/name/password, reject duplicate email, store hashed password, return user without password
- [x] 3.3 `POST /api/auth/login` — verify credentials, issue bearer JWT; reject wrong/unknown credentials
- [x] 3.4 Auth middleware/helper to resolve user from `Authorization: Bearer` header; reject missing/malformed/expired tokens
- [x] 3.5 `GET /api/auth/me` — return current authenticated user

## 4. Classes (REST) — class-management spec

- [x] 4.1 `POST /api/classes` — authenticated; create class with opaque ID, set owner, add owner membership
- [x] 4.2 `GET /api/classes` — list classes where user is owner or member
- [x] 4.3 `GET /api/classes/:id` — return class for member/owner; forbid non-members
- [x] 4.4 Shared authorization helper: assert requesting user is member/owner of a class

## 5. Invitations (REST) — class-invitations spec

- [x] 5.1 `POST /api/classes/:id/invitations` — owner-only; invite existing user by email; 404 if user not found; no duplicate if pending/member
- [x] 5.2 `GET /api/invitations` — list pending invitations addressed to current user (with class + inviter)
- [x] 5.3 `POST /api/invitations/:id/accept` — invitee-only; add membership, mark accepted
- [x] 5.4 `POST /api/invitations/:id/decline` — invitee-only; mark declined; forbid responding to others' invitations

## 6. Board persistence (REST) — realtime-board spec

- [x] 6.1 Ensure each class has an associated (implicit) board; element rows keyed by classId
- [x] 6.2 `GET /api/classes/:id/board` — member-only; return full element snapshot
- [x] 6.3 Validation (zod) for element types stroke/rect/ellipse/line/text and their data shapes; reject unknown types

## 7. Real-time server (Socket.IO) — realtime-board spec

- [x] 7.1 Add custom Node server (`server.ts`) hosting Next.js + Socket.IO on one HTTP server
- [x] 7.2 Socket auth middleware: validate bearer token from handshake `auth.token`; reject invalid
- [x] 7.3 `subscribe` handler: verify membership, join room `class:<id>`; reject non-members
- [x] 7.4 `board:op` handler: validate op (add/update/delete/clear), persist via Prisma, broadcast to room (last-write-wins by updatedAt)
- [x] 7.5 Throttle/batch high-frequency stroke point events server-side acknowledgement

## 8. Frontend UI (use frontend-design skill)

- [x] 8.1 Auth context/provider storing bearer token; API client that attaches `Authorization` header
- [x] 8.2 Register and Login pages (shadcn forms, validation, error states)
- [x] 8.3 Dashboard: list my classes, create-class dialog, pending invitations with accept/decline
- [x] 8.4 Class/board page: connect socket, fetch snapshot, subscribe to live ops
- [x] 8.5 Canvas component: free-hand draw, rect/ellipse/line tools, text tool, clear; emit ops and render incoming ops
- [x] 8.6 Invite-user dialog on the class page (owner only)
- [x] 8.7 Apply frontend-design skill for cohesive, distinctive visual style across all screens

## 9. Verification

- [x] 9.1 Manual: register two users, create class, invite + accept, draw on board in two windows and confirm live sync
- [x] 9.2 Verify auth guards: protected REST + socket reject missing/invalid token; non-members denied class/board access
- [x] 9.3 Verify late joiner receives full snapshot then live updates; clear broadcasts to all
- [x] 9.4 Update README with run instructions (DB setup, migrations, dev server)
