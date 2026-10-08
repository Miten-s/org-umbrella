/** Every system pick list the dropdowns read (codes match `PHRASE_CODES` in LimsPhrase.api.ts).
 * Seeded by migration 005-seed-system-pick-lists; labs can add their own values afterwards. */
import { UNIT_PHRASE } from "./pick-list-units";

export interface SeedPhrase {
  phrase: string;
  name: string;
  description: string;
  entries: string[];
}

/** Starting values only — ordinary entries, not system-locked; a lab adds its own. */
export const SYSTEM_PHRASES: SeedPhrase[] = [
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
    entries: [
      "Building",
      "Room",
      "Freezer",
      "Refrigerator",
      "Cabinet",
      "Shelf",
      "Rack"
    ]
  },
  {
    phrase: "STOCK_TYPE",
    name: "Stock Type",
    description: "Kind of stock item",
    entries: [
      "Reagent",
      "Solvent",
      "Standard",
      "Consumable",
      "Column",
      "Glassware"
    ]
  },
  {
    phrase: "STOCK_BATCH_STATUS",
    name: "Stock Batch Status",
    description: "Lifecycle state of a stock batch",
    entries: [
      "Available",
      "Quarantine",
      "In Use",
      "Expired",
      "Depleted",
      "Rejected"
    ]
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
    entries: [
      "HPLC",
      "GC",
      "UV-Vis Spectrophotometer",
      "FTIR",
      "Balance",
      "pH Meter",
      "Dissolution Apparatus",
      "Karl Fischer Titrator"
    ]
  },
  {
    phrase: "MEASUREMENT_TYPE",
    name: "Measurement Type",
    description: "What an instrument measures",
    entries: [
      "Chromatographic",
      "Spectroscopic",
      "Gravimetric",
      "Volumetric",
      "Physical",
      "Electrochemical"
    ]
  },
  {
    phrase: "INSTRUMENT_STATUS",
    name: "Instrument Status",
    description: "Operational state of an instrument",
    // "In Calibration" is required by the spec: a calibration falling due sets
    // the instrument to it, which blocks results being recorded against it.
    entries: [
      "Operational",
      "In Calibration",
      "Under Maintenance",
      "Out of Service",
      "Retired"
    ]
  },
  {
    phrase: "CALIBRATION_TYPE",
    name: "Calibration Type",
    description: "Kind of calibration activity",
    entries: [
      "Internal",
      "External",
      "Preventive Maintenance",
      "Qualification",
      "Verification"
    ]
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
    entries: [
      "Assay",
      "Impurity",
      "Dissolution",
      "Microbiological",
      "Physical",
      "Identification",
      "Water Content"
    ]
  },
  {
    phrase: "APPROVAL_STATUS",
    name: "Approval Status",
    description: "Approval state of a method or specification",
    entries: [
      "Draft",
      "In Review",
      "Approved",
      "Rejected",
      "Superseded",
      "Retired"
    ]
  },
  {
    phrase: "SAMPLE_TYPE",
    name: "Sample Type",
    description: "Kind of sample",
    entries: [
      "Raw Material",
      "In-Process",
      "Finished Product",
      "Stability",
      "Environmental",
      "Water",
      "Retain",
      "Calibration"
    ]
  },
  UNIT_PHRASE
];
