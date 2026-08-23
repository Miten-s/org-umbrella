import { QueryInterface } from "sequelize";

/**
 * `lims_users.signature` was VARCHAR(200), sized for a filename — but the
 * Lab User form's signature pad (SignatureField) captures and sends a full
 * `data:image/png;base64,...` string, easily several KB. Every save failed
 * validation ("signature must be shorter than or equal to 200 characters")
 * and there was no upload endpoint to turn it into a short filename instead
 * (unlike System IT Administration's Users, which stores just `req.file
 * .filename` from an actual multipart upload). Widening the column to match
 * what the client already sends is the minimal fix; storing the drawn
 * signature as a real uploaded file, mirroring System IT Administration, is
 * the better long-term shape but a larger change.
 */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.sequelize.query(
    `ALTER TABLE lims_users ALTER COLUMN signature TYPE TEXT`
  );
};
