import { QueryInterface } from "sequelize";

/**
 * `getUsers` filters by `status` and always sorts by `created_at DESC` — with only the
 * existing `email` index, both ops degrade to a sequential scan + sort once this table
 * reaches real production scale.
 */
export const up = async (queryInterface: QueryInterface) => {
  const sequelize = queryInterface.sequelize;
  await sequelize.query(
    `CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users" ("status");`
  );
  await sequelize.query(
    `CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at" DESC);`
  );
};
