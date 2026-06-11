## Context

Chalkboard is a greenfield fullstack app. A teacher creates a "class" that is a collaborative whiteboard; members who have the board open see live edits. Requirements: Next.js, shadcn/ui, MySQL, bearer-token auth, email/password signup, class creation/listing by unique ID, class invitations, and real-time board sync.

Key constraint: Next.js API routes (serverless-style) do not hold persistent WebSocket connections well. Real-time needs a long-lived socket server. We run a custom Node server hosting both Next.js and a Socket.IO server in the same process.

## Goals / Non-Goals

**Goals:**
- Single deployable app: Next.js (UI + REST) + Socket.IO (real-time) on one Node server.
- Bearer-token auth (JWT) for REST; same token authorizes socket connections.
- Persist users, classes, memberships, invitations, and board state in MySQL via Prisma.
- Board supports free-hand strokes, geometric shapes (rect/ellipse/line), and text; edits broadcast to all members viewing a class room.
- Distinctive, production-grade UI built with the `frontend-design` skill.

**Non-Goals:**
- OAuth / social login, password reset, email delivery (invites are in-app only for v1).
- Operational transform / CRDT conflict resolution — v1 uses last-write-wins per element.
- Mobile native apps; offline mode; presence cursors beyond basic broadcast.
- Fine-grained RBAC beyond owner vs member.

## Decisions

- **Framework: Next.js App Router + custom Node server.** API routes serve REST; a custom `server.ts` attaches Socket.IO to the same HTTP server. *Alternative:* separate microservice for sockets — rejected for v1 to keep one deployable.
- **DB access: Prisma + MySQL.** Type-safe schema/migrations, good DX. *Alternative:* raw `mysql2` — more boilerplate, dropped.
- **Auth: JWT bearer tokens, bcrypt password hashing.** Login issues a signed JWT (`sub`=userId). REST middleware validates `Authorization: Bearer`. Socket handshake passes the same token in `auth.token`. *Alternative:* server sessions/cookies — bearer chosen per requirements.
- **Real-time transport: Socket.IO.** Room per class (`class:<id>`). On `board:op` the server validates membership, persists the op, and broadcasts to the room. *Alternative:* raw `ws` / SSE — Socket.IO gives rooms, reconnection, ack out of the box.
- **Board model: element list.** Board = ordered list of elements `{ id, type, data, authorId, updatedAt }`. Types: `stroke`, `rect`, `ellipse`, `line`, `text`. Ops: `add`, `update`, `delete`, `clear`. Stored as rows in `board_elements` (JSON `data` column). On join, client fetches full snapshot via REST then subscribes to ops. *Alternative:* store one big JSON blob per board — worse for concurrent partial updates.
- **Conflict strategy: last-write-wins per element** keyed by `updatedAt`. Acceptable for classroom use; documented as a trade-off.
- **Class ID: short opaque ID** (e.g. cuid/nanoid) used in URLs and for linking/listing. Avoids exposing sequential PKs.
- **Drawing layer: HTML canvas via a thin React layer.** Capture pointer events into strokes/shapes; render element list each frame.

## Risks / Trade-offs

- **[Last-write-wins can drop concurrent edits to the same element]** → Elements are fine-grained; simultaneous edits to the *same* element are rare in a teaching context. Revisit with CRDT if needed.
- **[Custom server breaks some Next.js serverless deploy targets (e.g. Vercel)]** → Deploy as a long-running Node process (container / VM). Documented in migration plan.
- **[Token in socket handshake could leak if logged]** → Never log handshake auth; validate and discard.
- **[Large boards send big snapshots]** → Paginate/snapshot elements; cap element count per board for v1.
- **[High-frequency stroke events flood the room]** → Batch/throttle stroke points client-side before emitting.

## Migration Plan

1. Scaffold Next.js app, Tailwind + shadcn/ui, Prisma.
2. Define Prisma schema; run initial migration against MySQL.
3. Build auth (REST) → classes → invitations → board REST snapshot.
4. Add custom server + Socket.IO; wire board ops.
5. Build UI screens with `frontend-design` skill.
6. Deploy as a Node container with a managed MySQL instance. Rollback = redeploy prior image; DB migrations are additive/reversible.

## Open Questions

- Invitation by email address (must pre-exist as a user) vs. shareable invite link? v1 assumes invitee is an existing user (by email).
- Should non-owner members be allowed to edit the board, or view-only by default? v1 assumes all members can edit.
- Retention/limits on board element count per class.
