import ENV from "../utils/environment";
import { logError, logInfo } from "../configs/logger.config";

export type LimsEvent =
  | "sample.oos"
  | "calibration.failed"
  | "sample.status.changed";

export interface LimsEventPayload {
  event: LimsEvent;
  entityId: string;
  entityType: string;
  data: Record<string, any>;
  timestamp: string;
  triggeredBy: string;
}

export const publishEvent = async (payload: LimsEventPayload): Promise<void> => {
  try {
    logInfo(
      `[KAFKA STUB] Event published: ${payload.event}`,
      { payload },
      "publishEvent",
      "kafka.service.ts"
    );
  } catch (error) {
    logError("Failed to publish Kafka event", { payload, error }, "publishEvent", "kafka.service.ts");
  }
};

export const initKafkaConsumers = async (): Promise<void> => {
  logInfo(
    `[KAFKA STUB] Consumer init called. Broker: ${ENV.KAFKA_BROKER}. Real consumers will be wired later.`,
    null,
    "initKafkaConsumers",
    "kafka.service.ts"
  );
};
