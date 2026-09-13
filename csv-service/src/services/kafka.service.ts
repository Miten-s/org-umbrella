import { Kafka, Producer, Consumer } from "kafkajs";
import ENV from "../utils/environment";
import CsvApplication from "../models/csv-application.model";
import CsvChangeControl from "../models/csv-change-control.model";
import CsvProject from "../models/csv-project.model";
import { writeAudit } from "../utils/audit.util";

const kafka = new Kafka({
  clientId: ENV.KAFKA_CLIENT_ID,
  brokers: [ENV.KAFKA_BROKER]
});

export const kafkaProducer: Producer = kafka.producer();
export const kafkaConsumer: Consumer = kafka.consumer({
  groupId: ENV.KAFKA_GROUP_ID
});

let isConnected = false;

export const initKafka = async (): Promise<void> => {
  try {
    await kafkaProducer.connect();
    await kafkaConsumer.connect();
    isConnected = true;
    console.log(
      "[csv-service] Kafka producer and consumer connected successfully."
    );

    // Subscribe to GxP Change Control approval events
    await kafkaConsumer.subscribe({
      topic: "gxp.change.approved",
      fromBeginning: true
    });

    await kafkaConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;
          const payload = JSON.parse(message.value.toString());
          console.log(
            `[csv-service] Received Kafka event on topic ${topic} (partition ${partition}):`,
            payload
          );

          if (topic === "gxp.change.approved") {
            await handleGxpChangeApproved(payload);
          }
        } catch (err) {
          console.error("[csv-service] Error processing Kafka message:", err);
        }
      }
    });
  } catch (error) {
    console.warn(
      "[csv-service] Warning: Kafka connection initialization failed (service running in standalone REST mode):",
      error
    );
  }
};

export const handleGxpChangeApproved = async (payload: {
  changeControlId: string;
  title: string;
  appCode?: string;
  appName?: string;
}): Promise<CsvProject> => {
  const {
    changeControlId,
    title,
    appCode = "APP-GENERIC",
    appName = "Enterprise Application"
  } = payload;

  // 1. Ensure Application Registry Record exists
  let application = await CsvApplication.findOne({ where: { appCode } });
  if (!application) {
    application = await CsvApplication.create({
      appCode,
      name: appName,
      gxpClassification: "GXP"
    });
  }

  // 2. Ensure Change Control record exists
  let changeControl = await CsvChangeControl.findOne({
    where: { changeCode: changeControlId }
  });
  if (!changeControl) {
    changeControl = await CsvChangeControl.create({
      changeCode: changeControlId,
      title: title || `Change Control ${changeControlId}`,
      status: "APPROVED"
    });
  }

  // 3. Idempotently check if project already exists for this Change Control
  let project = await CsvProject.findOne({
    where: { gxpChangeControlId: changeControlId }
  });

  if (!project) {
    project = await CsvProject.create({
      appId: application.id,
      gxpChangeControlId: changeControlId,
      projectTitle: title || `Validation for ${changeControlId}`,
      currentPhase: "INTAKE",
      status: "INTAKE"
    });

    // Write ALCOA+ audit entry for Intake
    await writeAudit({
      entityName: "csv_projects",
      entityId: project.id,
      action: "CREATE",
      newValue: project.toJSON(),
      actor: {
        id: "00000000-0000-0000-0000-000000000000",
        fullName: "Kafka Listener (gxp-service)"
      }
    });

    console.log(
      `[csv-service] Step 1 Intake Complete: Created csv_projects record (${project.id}) for change ${changeControlId}`
    );
  }

  return project;
};

export const publishEvent = async (
  topic: string,
  message: object
): Promise<void> => {
  if (!isConnected) {
    console.warn(
      `[csv-service] Kafka not connected. Skipping message publish to ${topic}`
    );
    return;
  }

  try {
    await kafkaProducer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
    console.log(`[csv-service] Published message to Kafka topic ${topic}`);
  } catch (error) {
    console.error(
      `[csv-service] Failed to publish message to topic ${topic}:`,
      error
    );
  }
};
