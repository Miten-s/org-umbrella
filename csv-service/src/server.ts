import app from "./app";
import ENV from "./utils/environment";
import { connectDB, sequelize } from "./configs/db.sequelize";
import { migrations, runMigrations } from "./migrations";
import { initKafka } from "./services/kafka.service";
import { initPeriodicReviewCron } from "./services/periodic-review.service";

const startServer = async () => {
  try {
    console.log("[csv-service] Starting microservice...");

    // 1. Connect DB & Register Associations
    await connectDB();

    // 2. Run Database Migrations
    await runMigrations(sequelize, migrations);

    // 3. Initialize Kafka Event Bus Consumer
    await initKafka();

    // 4. Initialize Periodic Review Cron Scheduler
    initPeriodicReviewCron();

    // 5. Listen on Port
    const server = app.listen(ENV.PORT, () => {
      console.log(
        `[csv-service] Server running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode.`
      );
    });

    const shutdown = async (signal: string) => {
      console.log(
        `[csv-service] Received ${signal}. Shutting down gracefully...`
      );
      server.close(async () => {
        await sequelize.close();
        console.log("[csv-service] Database connection closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("[csv-service] Server initialization failed:", error);
    process.exit(1);
  }
};

startServer();
