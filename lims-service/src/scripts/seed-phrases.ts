import { createPhrase } from "../services/phrase.service";
import { getPhraseByNameRepo } from "../repo/phrase.repo";

const systemPhrases = [
  {
    name: "SAMPLE_STATUS",
    description: "Core statuses for sample lifecycle",
    entries: [
      { entryKey: "LOGGED", entryValue: "Logged", sortOrder: 1 },
      { entryKey: "IN_PROGRESS", entryValue: "In Progress", sortOrder: 2 },
      { entryKey: "COMPLETE", entryValue: "Complete", sortOrder: 3 },
      { entryKey: "OUT_OF_RANGE", entryValue: "Out of Range", sortOrder: 4 },
      { entryKey: "CANCELLED", entryValue: "Cancelled", sortOrder: 5 }
    ]
  },
  {
    name: "COMPONENT_TYPES",
    description: "Types of analysis components",
    entries: [
      { entryKey: "NUMERIC", entryValue: "Numeric", sortOrder: 1 },
      { entryKey: "TEXT", entryValue: "Text", sortOrder: 2 },
      { entryKey: "BOOLEAN", entryValue: "Boolean", sortOrder: 3 },
      { entryKey: "OPTION", entryValue: "Option", sortOrder: 4 }
    ]
  },
  {
    name: "SUPPLIER_RATINGS",
    description: "Ratings for suppliers",
    entries: [
      { entryKey: "A", entryValue: "Excellent", sortOrder: 1 },
      { entryKey: "B", entryValue: "Good", sortOrder: 2 },
      { entryKey: "C", entryValue: "Fair", sortOrder: 3 },
      { entryKey: "D", entryValue: "Poor", sortOrder: 4 }
    ]
  }
];

export const seedSystemPhrases = async () => {
  console.log("Checking and seeding system phrases...");
  for (const phrase of systemPhrases) {
    const exists = await getPhraseByNameRepo(phrase.name);
    if (!exists) {
      await createPhrase(
        { name: phrase.name, description: phrase.description, isSystem: true },
        phrase.entries
      );
      console.log(`Seeded system phrase: ${phrase.name}`);
    }
  }
  console.log("System phrases check complete.");
};
