import { QueryInterface } from "sequelize";
import crypto from "crypto";

// Generate a deterministic UUID from a string
function stringToUUID(str: string, namespace: string): string {
  const hash = crypto.createHash("sha256").update(namespace + ":" + str).digest("hex");
  const p1 = hash.substring(0, 8);
  const p2 = hash.substring(8, 12);
  const p3 = hash.substring(12, 16);
  const p4 = hash.substring(16, 20);
  const p5 = hash.substring(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export const up = async (queryInterface: QueryInterface) => {
  const requestTypes = [
    "Provide Access",
    "Modify Access",
    "Remove Access",
    "Generate Report",
    "Add Master Data Request",
    "Edit Master Data Request",
    "Remove Master Data Request",
    "Other Request"
  ];

  const now = new Date();

  for (const service of requestTypes) {
    const id = stringToUUID(service, "app_service");
    await queryInterface.sequelize.query(
      `INSERT INTO app_services (id, service, active, created_at, updated_at)
       VALUES (:id, :service, true, :now, :now)
       ON CONFLICT (service) DO NOTHING`,
      { replacements: { id, service, now } }
    );
  }
};

export const down = async (queryInterface: QueryInterface) => {
  // Safe cleanup if needed
};
