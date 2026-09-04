import Phrase from "../models/phrase.model";
import PhraseEntry from "../models/phrase-entry.model";
import { logInfo, logError } from "../configs/logger.config";

/** Boot-time check that every pick list the UI reads exists and has values — a missing one
 * fails silently everywhere else, so this turns it into one log line. Only warns, never blocks boot. */

/** Must match `PHRASE_CODES` in LimsPhrase.api.ts — separate deployables, so this check
 * is what stops the two copies drifting apart silently. */
export const REQUIRED_PHRASE_CODES = [
  "RATING",
  "LOCATION_TYPE",
  "STOCK_TYPE",
  "STOCK_BATCH_STATUS",
  "PARAMETER_TYPE",
  "INSTRUMENT_TYPE",
  "MEASUREMENT_TYPE",
  "INSTRUMENT_STATUS",
  "CALIBRATION_TYPE",
  "CALIBRATION_STATUS",
  "ANALYSIS_TYPE",
  "APPROVAL_STATUS",
  "SAMPLE_TYPE"
] as const;

export interface PhraseHealth {
  missing: string[];
  empty: string[];
  healthy: number;
}

export const checkPhraseHealth = async (): Promise<PhraseHealth> => {
  const phrases = await Phrase.findAll({
    where: { isDeleted: false },
    include: [{ model: PhraseEntry, as: "entries", attributes: ["id"], required: false }]
  });

  const byCode = new Map(phrases.map((row) => [row.phrase, row]));

  const missing: string[] = [];
  const empty: string[] = [];

  for (const code of REQUIRED_PHRASE_CODES) {
    const found = byCode.get(code);
    if (!found) missing.push(code);
    // Present but with nothing in it — the dropdown is just as empty.
    else if (((found as any).entries?.length ?? 0) === 0) empty.push(code);
  }

  return { missing, empty, healthy: REQUIRED_PHRASE_CODES.length - missing.length - empty.length };
};

/** Runs the check and logs the outcome. Never throws — boot must not depend on it. */
export const reportPhraseHealth = async (): Promise<void> => {
  try {
    const { missing, empty, healthy } = await checkPhraseHealth();

    if (!missing.length && !empty.length) {
      logInfo("pick lists ready", { total: REQUIRED_PHRASE_CODES.length });
      return;
    }

    logError("PICK LISTS INCOMPLETE — dropdowns will render empty with no error", {
      missing,
      empty,
      healthy,
      fix: "npx ts-node src/scripts/seed-phrases.ts"
    });
  } catch (error) {
    logError("pick list health check failed", { error: String(error) });
  }
};

export default reportPhraseHealth;
