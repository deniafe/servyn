import { createServer } from "node:http";

const rawPort = process.env.REALTIME_PORT ?? process.env.PORT ?? "4002";
const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  process.stderr.write(
    `${JSON.stringify({ level: "error", service: "realtime", msg: "invalid_port", rawPort })}\n`,
  );
  process.exit(1);
}

const server = createServer((req, res) => {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  if (req.method === "GET" && pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "realtime",
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.on("error", (err) => {
  process.stderr.write(
    `${JSON.stringify({ level: "error", service: "realtime", msg: "server_error", error: err.message })}\n`,
  );
  process.exit(1);
});

server.listen(port, () => {
  process.stdout.write(
    `${JSON.stringify({ level: "info", service: "realtime", msg: "listening", port })}\n`,
  );
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
