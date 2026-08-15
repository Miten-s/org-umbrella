/**
 * Seed the system pick lists.
 *
 * The spec is explicit that these are "pre created and can't be deleted,
 * additional value can be added" — so they ship with the application rather
 * than being typed in by an administrator. Every relational dropdown in the UI
 * (Location Type, Stock Type, Rating, …) reads from here; without them the
 * forms render empty selects and nothing can be created.
 *
 * The codes are the same 13 in frontend/src/pages/lims/phrases/LimsPhrase.api.ts
 * (`PHRASE_CODES`). Both sides must agree or a dropdown queries a pick list
 * that does not exist — re-verify with:
 *   sed -n '/PHRASE_CODES/,/} as const/p' frontend/src/pages/lims/phrases/LimsPhrase.api.ts
 *
 * Idempotent: re-running adds anything missing and leaves existing rows — and
 * any values a lab has added of its own — untouched.
 *
 *   npx ts-node src/scripts/seed-phrases.ts
 */
import "dotenv/config";
import { sequelize } from "../configs/db.sequelize";
import { registerAssociations } from "../models/associations";
import Phrase from "../models/phrase.model";
import PhraseEntry from "../models/phrase-entry.model";

interface SeedPhrase {
  phrase: string;
  name: string;
  description: string;
  entries: string[];
}

/**
 * Starting values only. They are ordinary entries, not system-locked: a lab is
 * expected to add its own, and to stop using ones that don't apply.
 */
const SYSTEM_PHRASES: SeedPhrase[] = [
  {
    phrase: "RATING",
    name: "Rating",
    description: "Supplier and customer rating",
    entries: ["Approved", "Preferred", "Conditional", "Unapproved"]
  },
  {
    phrase: "LOCATION_TYPE",
    name: "Location Type",
    description: "Kind of storage location",
    entries: ["Building", "Room", "Freezer", "Refrigerator", "Cabinet", "Shelf", "Rack"]
  },
  {
    phrase: "STOCK_TYPE",
    name: "Stock Type",
    description: "Kind of stock item",
    entries: ["Reagent", "Solvent", "Standard", "Consumable", "Column", "Glassware"]
  },
  {
    phrase: "STOCK_BATCH_STATUS",
    name: "Stock Batch Status",
    description: "Lifecycle state of a stock batch",
    entries: ["Available", "Quarantine", "In Use", "Expired", "Depleted", "Rejected"]
  },
  {
    phrase: "PARAMETER_TYPE",
    name: "Parameter Type",
    description: "Data type of a parameter value",
    entries: ["Numeric", "Text", "Boolean", "Date", "Option"]
  },
  {
    phrase: "INSTRUMENT_TYPE",
    name: "Instrument Type",
    description: "Category of instrument",
    entries: ["HPLC", "GC", "UV-Vis Spectrophotometer", "FTIR", "Balance", "pH Meter", "Dissolution Apparatus", "Karl Fischer Titrator"]
  },
  {
    phrase: "MEASUREMENT_TYPE",
    name: "Measurement Type",
    description: "What an instrument measures",
    entries: ["Chromatographic", "Spectroscopic", "Gravimetric", "Volumetric", "Physical", "Electrochemical"]
  },
  {
    phrase: "INSTRUMENT_STATUS",
    name: "Instrument Status",
    description: "Operational state of an instrument",
    // "In Calibration" is required by the spec: a calibration falling due sets
    // the instrument to it, which blocks results being recorded against it.
    entries: ["Operational", "In Calibration", "Under Maintenance", "Out of Service", "Retired"]
  },
  {
    phrase: "CALIBRATION_TYPE",
    name: "Calibration Type",
    description: "Kind of calibration activity",
    entries: ["Internal", "External", "Preventive Maintenance", "Qualification", "Verification"]
  },
  {
    phrase: "CALIBRATION_STATUS",
    name: "Calibration Status",
    description: "State of a calibration",
    entries: ["Scheduled", "Due", "Overdue", "In Progress", "Passed", "Failed"]
  },
  {
    phrase: "ANALYSIS_TYPE",
    name: "Analysis Type",
    description: "Category of analytical method",
    entries: ["Assay", "Impurity", "Dissolution", "Microbiological", "Physical", "Identification", "Water Content"]
  },
  {
    phrase: "APPROVAL_STATUS",
    name: "Approval Status",
    description: "Approval state of a method or specification",
    entries: ["Draft", "In Review", "Approved", "Rejected", "Superseded", "Retired"]
  },
  {
    phrase: "SAMPLE_TYPE",
    name: "Sample Type",
    description: "Kind of sample",
    entries: ["Raw Material", "In-Process", "Finished Product", "Stability", "Environmental", "Water", "Retain", "Calibration"]
  }
];

/** `LOCATION_TYPE` + "Freezer" → `LOCATION_TYPE_FREEZER`. */
const entryKey = (phrase: string, value: string) =>
  `${phrase}_${value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")}`;

const run = async () => {
  await sequelize.authenticate();
  registerAssociations();

  let createdPhrases = 0;
  let createdEntries = 0;

  for (const seed of SYSTEM_PHRASES) {
    const [phrase, isNew] = await Phrase.findOrCreate({
      where: { phrase: seed.phrase },
      defaults: {
        phrase: seed.phrase,
        name: seed.name,
        description: seed.description,
        // Marks it undeletable — the spec's "can't be deleted".
        isSystem: true,
        // Global reference data: visible to every group.
        groupId: null
      } as any
    });

    if (isNew) createdPhrases += 1;

    for (const value of seed.entries) {
      const [, entryIsNew] = await PhraseEntry.findOrCreate({
        where: { phraseId: phrase.id, phraseEntryId: entryKey(seed.phrase, value) },
        defaults: {
          phraseId: phrase.id,
          phraseEntryId: entryKey(seed.phrase, value),
          name: value
        } as any
      });
      if (entryIsNew) createdEntries += 1;
    }
  }

  console.log(
    `Pick lists seeded: ${SYSTEM_PHRASES.length} checked, ` +
      `${createdPhrases} created, ${createdEntries} values added.`
  );

  await sequelize.close();
};

run().catch((error) => {
  console.error("Seeding pick lists failed:", error);
  process.exit(1);
});
