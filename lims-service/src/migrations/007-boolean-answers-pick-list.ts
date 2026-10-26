import { QueryInterface } from "sequelize";
import { phraseEntryKey } from "../configs/pick-list-units";
import { SYSTEM_PHRASES } from "../configs/system-pick-lists";
import { BOOLEAN_ANSWERS_PHRASE } from "../configs/component-types";
import { seedSystemPhrase } from "./005-seed-system-pick-lists";

/** Boolean answer pairs were a fixed code list; they now live in the BOOLEAN_ANSWERS pick list. */
const LEGACY_CODES: Record<string, string> = {
  YES_NO: "Yes / No",
  PASS_FAIL: "Pass / Fail",
  COMPLIES: "Complies / Does not comply",
  PRESENT_ABSENT: "Present / Absent"
};

export const up = async (queryInterface: QueryInterface) => {
  const db = queryInterface.sequelize;
  const seed = SYSTEM_PHRASES.find((p) => p.phrase === BOOLEAN_ANSWERS_PHRASE);
  if (seed) await seedSystemPhrase(db, seed);

  // Templates and the per-test snapshots both store the old code — point them at the entry key.
  for (const [code, name] of Object.entries(LEGACY_CODES)) {
    const replacements = {
      code,
      key: phraseEntryKey(BOOLEAN_ANSWERS_PHRASE, name)
    };
    await db.query(
      `UPDATE lims_analysis_components SET option = :key
        WHERE type = 'BOOLEAN' AND option = :code`,
      { replacements }
    );
    await db.query(
      `UPDATE lims_test_windows SET component_option = :key
        WHERE component_type = 'BOOLEAN' AND component_option = :code`,
      { replacements }
    );
  }
};
