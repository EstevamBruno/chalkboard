import { loadEnvConfig } from "@next/env";

// Load .env before importing anything that reads env vars at module load time
// (auth reads JWT_SECRET, Prisma reads DATABASE_URL).
loadEnvConfig(process.cwd());

async function main() {
  const { createServer } = await import("http");
  const { parse } = await import("url");
  const next = (await import("next")).default;
  const { attachSocketServer } = await import("@/server/socket");

  const dev = process.env.NODE_ENV !== "production";
  const port = parseInt(process.env.PORT || "3000", 10);

  const app = next({ dev });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  attachSocketServer(server);

  server.listen(port, () => {
    console.log(`▸ Chalkboard ready on http://localhost:${port} (dev=${dev})`);
    console.log(`▸ Socket.IO listening on path /api/socket`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
