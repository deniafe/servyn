import { createServer } from "node:http";
import { createLogger, initNodeSentry } from "@servyn/observability/node";

initNodeSentry("worker");
const logger = createLogger({ service: "worker", module: "server" });

const rawPort = process.env.WORKER_PORT ?? process.env.PORT ?? "4001";
const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  logger.error("invalid_port", { rawPort });
  process.exit(1);
}

const server = createServer((req, res) => {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  if (req.method === "GET" && pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "worker",
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.on("error", (err) => {
  logger.error("server_error", { error: err.message });
  process.exit(1);
});

server.listen(port, () => {
  logger.info("listening", { port });
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
