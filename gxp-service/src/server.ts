import app from "./app";
import ENV from "./utils/environment";
import { sequelize, authSequelize } from "./configs/db.sequelize";
import { logError, logInfo } from "./configs/logger.config";

const PORT = ENV.PORT || 9001;

const server = app.listen(PORT, () => {
  logInfo(`Server running on http://localhost:${PORT}`);
});

// A hung request with no timeout is the #1 cause of cascading failure. Fail fast.
server.requestTimeout = 30_000; // 30s to receive the full request
server.headersTimeout = 35_000; // must exceed requestTimeout
server.keepAliveTimeout = 65_000; // > typical LB idle timeout

let shuttingDown = false;

// Graceful shutdown: stop accepting new connections, drain in-flight requests,
// close the DB pools, then exit — with a hard cap so we never hang forever.
const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logInfo(`${signal} received — draining connections`);

  const force = setTimeout(() => {
    logError("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 15_000);
  force.unref();

  server.close(async () => {
    try {
      await Promise.allSettled([sequelize.close(), authSequelize.close()]);
    } catch (e) {
      logError("Error closing DB pools during shutdown", { error: String(e) });
    }
    clearTimeout(force);
    logInfo("Shutdown complete");
    process.exit(0);
  });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logError("Unhandled promise rejection", { reason: String(reason) });
});
process.on("uncaughtException", (err) => {
  logError("Uncaught exception", { error: String(err) });
  void shutdown("uncaughtException");
});
