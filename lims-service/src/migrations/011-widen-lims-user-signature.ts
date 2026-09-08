import { QueryInterface } from "sequelize";

/** `signature` was VARCHAR(200) (sized for a filename) but SignatureField sends a full
 * base64 data URI — widened to TEXT as the minimal fix; a real upload endpoint is the better long-term shape. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `ALTER TABLE lims_users ALTER COLUMN signature TYPE TEXT`
  );
};
