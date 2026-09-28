/** The UNIT pick list: starting pharma/QC units, shared by `seed-phrases` and migration 016
 * so both paths insert identical `phrase_entry_id` keys. Labs can add their own afterwards. */
export const UNIT_PHRASE = {
  phrase: "UNIT",
  name: "Unit",
  description: "Unit of measure",
  entries: [
    // Mass
    "kg",
    "g",
    "mg",
    "µg",
    "ng",
    // Volume
    "L",
    "mL",
    "µL",
    // Amount of substance / molarity
    "mol",
    "mmol",
    "µmol",
    "mol/L",
    "mmol/L",
    // Concentration
    "g/L",
    "mg/L",
    "mg/mL",
    "µg/mL",
    "ng/mL",
    "ppm",
    "ppb",
    "%",
    "% w/w",
    "% w/v",
    "% v/v",
    // Potency / microbiology
    "IU",
    "IU/mL",
    "CFU",
    "CFU/mL",
    "CFU/g",
    "EU/mL",
    // Physical
    "pH",
    "°C",
    "mS/cm",
    "µS/cm",
    "NTU",
    "cP",
    "nm",
    "µm",
    "mm",
    "min",
    "h",
    // Count / dosage forms
    "count",
    "Tablet",
    "Capsule",
    "Vial",
    "Ampoule",
    "Unit"
  ]
};

/** `LOCATION_TYPE` + "Freezer" → `LOCATION_TYPE_FREEZER`; µ and % are spelled out so
 * "µL"/"L" and "%"/"" don't collapse onto the same key. */
export const phraseEntryKey = (phrase: string, value: string) =>
  `${phrase}_${value
    .replace(/[µμ]/g, "u")
    .replace(/%/g, "PCT")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}`;
