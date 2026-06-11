## Why

Teachers need a shared, live whiteboard to run classes online. Today there is no product here — Chalkboard introduces the first version: a fullstack web app where a user creates a class (a collaborative board) and everyone with the board open sees edits as they happen.

## What Changes

- Introduce a Next.js (App Router) + shadcn/ui frontend and a Next.js API backend backed by MySQL.
- Add email/password registration with basic profile data (email, name, password).
- Add bearer-token authentication (login returns a token; protected endpoints require `Authorization: Bearer <token>`).
- Any authenticated user can create a class. Each class has a unique ID used for listing and linking users.
- A class owner can invite other users to join a class; invited users can accept and become members.
- Add a collaborative board per class: free-hand drawing (mouse), geometric shapes, and text.
- Make the board real-time: edits by one member are pushed live to all members currently viewing the board (WebSocket-based).
- UI is built using the `frontend-design` skill for distinctive, production-grade visuals.

## Capabilities

### New Capabilities
- `user-auth`: Email/password registration and bearer-token login/session for authenticated access.
- `class-management`: Create, list, and view classes; each class has a unique ID and an owner; membership links users to classes.
- `class-invitations`: Invite users to a class and accept/decline invitations to gain membership.
- `realtime-board`: Per-class board holding text, shapes, and free-hand strokes, with live multi-user synchronization.

### Modified Capabilities
<!-- None — greenfield project, no existing specs. -->

## Impact

- New codebase: Next.js app (frontend + API routes), shadcn/ui component library, MySQL schema.
- New dependencies: Next.js, React, shadcn/ui + Tailwind, an ORM (Prisma), MySQL driver, auth/hashing (bcrypt + JWT), a real-time transport (WebSocket server, e.g. Socket.IO), a canvas/drawing layer.
- New infra: MySQL database, a WebSocket server process alongside the Next.js app.
- APIs: REST endpoints for auth, classes, invitations; WebSocket channel per class for board sync.
