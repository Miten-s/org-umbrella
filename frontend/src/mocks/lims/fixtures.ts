import { newId, registerEntity, type MockRow } from "./db";
import { LIMS_PERMISSIONS } from "@/utils/permissions";

/**
 * Seed data for the mocked lims-service. Entities the frontend hasn't built a
 * module for yet are registered with an empty (or tiny) seed so their endpoints
 * still answer — add rows as each module lands.
 */

const ref = (id: string, label: string, key = "name") => ({ id, [key]: label });

// --- Lab Groups -------------------------------------------------------------
const groupIds = Array.from({ length: 4 }, () => newId());
const owner = (name: string) => ref(newId(), name);

const groups: MockRow[] = [
  { id: groupIds[0], groupId: "LIMS_QC", name: "QC Lab", description: "Quality control" },
  { id: groupIds[1], groupId: "LIMS_RD", name: "R&D Lab", description: "Research" },
  { id: groupIds[2], groupId: "LIMS_MB", name: "Microbiology", description: "Micro testing" },
  { id: groupIds[3], groupId: "LIMS_ST", name: "Stability", description: "Stability studies" }
].map((row, index) => ({
  ...row,
  // Relations come back nested as { id, label }, per the spec.
  ownedBy: owner(["A. Shah", "R. Mehta", "P. Nair", "S. Iyer"][index]),
  parentGroup: index === 0 ? null : ref(groupIds[0], "QC Lab"),
  isRemoved: false
}));

// --- Pick List (phrase) entries --------------------------------------------
/** Phrase entries, grouped by phrase code — served by /lims-phrases/entries. */
export const phraseEntries: Record<string, MockRow[]> = {
  LOCATION_TYPE: [
    { id: newId(), phraseEntryId: "FREEZER", name: "Freezer" },
    { id: newId(), phraseEntryId: "FRIDGE", name: "Refrigerator" },
    { id: newId(), phraseEntryId: "ROOM", name: "Storage Room" },
    { id: newId(), phraseEntryId: "CABINET", name: "Cabinet" },
    { id: newId(), phraseEntryId: "SHELF", name: "Shelf" }
  ],
  RATING: [
    { id: newId(), phraseEntryId: "A", name: "Preferred" },
    { id: newId(), phraseEntryId: "B", name: "Approved" },
    { id: newId(), phraseEntryId: "C", name: "Conditional" }
  ],
  STOCK_TYPE: [
    { id: newId(), phraseEntryId: "REAGENT", name: "Reagent" },
    { id: newId(), phraseEntryId: "SOLVENT", name: "Solvent" },
    { id: newId(), phraseEntryId: "STANDARD", name: "Reference Standard" }
  ],
  INSTRUMENT_STATUS: [
    { id: newId(), phraseEntryId: "AVAILABLE", name: "Available" },
    { id: newId(), phraseEntryId: "IN_CALIBRATION", name: "In Calibration" },
    { id: newId(), phraseEntryId: "OUT_OF_SERVICE", name: "Out of Service" }
  ],
  SAMPLE_TYPE: [
    { id: newId(), phraseEntryId: "FINISHED", name: "Finished Product" },
    { id: newId(), phraseEntryId: "RAW", name: "Raw Material" },
    { id: newId(), phraseEntryId: "STABILITY", name: "Stability" },
    { id: newId(), phraseEntryId: "WATER", name: "Water" }
  ],
  PARAMETER_TYPE: [
    { id: newId(), phraseEntryId: "NUMERIC", name: "Numeric" },
    { id: newId(), phraseEntryId: "TEXT", name: "Text" },
    { id: newId(), phraseEntryId: "BOOLEAN", name: "Boolean" },
    { id: newId(), phraseEntryId: "DATE", name: "Date" }
  ]
};

// --- Parameters -------------------------------------------------------------
const parameterType = (name: string) =>
  ref(phraseEntries.PARAMETER_TYPE.find((e) => e.name === name)?.id ?? newId(), name);

const parameters: MockRow[] = [
  ["PARAM-001", "pH", "Numeric", "7.0", "pH"],
  ["PARAM-002", "Appearance", "Text", "Clear", ""],
  ["PARAM-003", "Assay", "Numeric", "100", "%"],
  ["PARAM-004", "Water Content", "Numeric", "0.5", "%"],
  ["PARAM-005", "Sterility", "Boolean", "true", ""],
  ["PARAM-006", "Storage Temperature", "Numeric", "25", "°C"],
  ["PARAM-007", "Expiry Check", "Date", "", ""],
  ["PARAM-008", "Colour", "Text", "White", ""]
].map(([parameterId, parameterName, type, defaultValue, unit]) => ({
  id: newId(),
  parameterId,
  parameterName,
  parameterType: parameterType(type),
  defaultValue,
  unit,
  isRemoved: false
}));

// --- Pick Lists (the phrases themselves) ------------------------------------
const PHRASE_META: Record<string, string> = {
  LOCATION_TYPE: "Location type",
  RATING: "Supplier / customer rating",
  STOCK_TYPE: "Stock type",
  INSTRUMENT_STATUS: "Instrument status",
  PARAMETER_TYPE: "Type of parameter"
};

const phrases: MockRow[] = Object.entries(phraseEntries).map(([code, entries]) => ({
  id: newId(),
  phrase: code,
  name: PHRASE_META[code] ?? code,
  description: `Values for ${PHRASE_META[code] ?? code}`,
  group: ref(groupIds[0], "QC Lab"),
  // Seeded by the backend — cannot be renamed or removed.
  isSystem: true,
  entries: entries.map((entry) => ({
    phraseEntryId: entry.phraseEntryId,
    name: entry.name,
    description: ""
  })),
  isRemoved: false
}));

// --- Suppliers --------------------------------------------------------------
const rating = (name: string) =>
  ref(phraseEntries.RATING.find((e) => e.name === name)?.id ?? newId(), name);

const suppliers: MockRow[] = [
  ["SUP-001", "Merck", "Preferred", "orders@merck.example", "K. Rao", "+91 22 4000 1000"],
  ["SUP-002", "Sigma-Aldrich", "Preferred", "sales@sigma.example", "N. Desai", "+91 22 4000 1001"],
  ["SUP-003", "Thermo Fisher", "Approved", "info@thermo.example", "M. Joshi", "+91 22 4000 1002"],
  ["SUP-004", "Agilent", "Approved", "care@agilent.example", "S. Kulkarni", "+91 22 4000 1003"],
  ["SUP-005", "Waters", "Conditional", "hello@waters.example", "D. Menon", "+91 22 4000 1004"],
  ["SUP-006", "Honeywell", "Approved", "chem@honeywell.example", "A. Bose", "+91 22 4000 1005"],
  ["SUP-007", "Borosil", "Conditional", "glass@borosil.example", "V. Shetty", "+91 22 4000 1006"]
].map(([supplierId, supplierName, ratingName, email, contactName, contactPhone], index) => ({
  id: newId(),
  supplierId,
  supplierName,
  description: `${supplierName} — laboratory supplier`,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  rating: rating(ratingName),
  website: `https://${String(supplierName).toLowerCase().replace(/[^a-z]/g, "")}.example`,
  contactName,
  contactPhone,
  email,
  address: {
    line1: `${index + 1} Industrial Estate`,
    line2: "",
    town: "Mumbai",
    state: "Maharashtra",
    zipcode: "400001",
    country: "India"
  },
  attachments: [],
  isRemoved: false
}));

// --- Customers & Projects ---------------------------------------------------
const customers: MockRow[] = [
  ["CUST-001", "Aurobindo Pharma", "Preferred", "R. Iyer"],
  ["CUST-002", "Cipla", "Approved", "M. Naik"],
  ["CUST-003", "Sun Pharmaceutical", "Preferred", "K. Verma"],
  ["CUST-004", "Dr. Reddy's", "Approved", "S. Pillai"],
  ["CUST-005", "Zydus Lifesciences", "Conditional", "T. Gupta"]
].map(([customerId, customerName, ratingName, contactName], index) => ({
  id: newId(),
  customerId,
  customerName,
  description: `${customerName} — contract testing client`,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  rating: rating(ratingName),
  website: "",
  contactName,
  contactPhone: `+91 40 2000 100${index}`,
  email: `qa@${String(customerName).toLowerCase().replace(/[^a-z]/g, "")}.example`,
  address: {
    line1: `${index + 10} Pharma City`,
    line2: "",
    town: "Hyderabad",
    state: "Telangana",
    zipcode: "500032",
    country: "India"
  },
  otherInformation: "",
  linkedProjects: [],
  attachments: [],
  isRemoved: false
}));

const projects: MockRow[] = [
  ["PRJ-001", "Metformin ER Stability", "MET-ER"],
  ["PRJ-002", "Amoxicillin Assay Validation", "AMX-AV"],
  ["PRJ-003", "Paracetamol Dissolution", "PCM-DS"],
  ["PRJ-004", "Sterile Water Monitoring", "SWM-01"],
  ["PRJ-005", "Excipient Qualification", "EXQ-01"],
  ["PRJ-006", "Cleaning Validation", "CLV-01"]
].map(([projectId, name, code], index) => ({
  id: newId(),
  projectId,
  name,
  code,
  details: `${name} — analytical work package`,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  customer: ref(String(customers[index % customers.length].id), String(customers[index % customers.length].customerName), "customerName"),
  customerContact: String(customers[index % customers.length].contactName),
  supervisor: ref(newId(), ["A. Shah", "R. Mehta", "P. Nair"][index % 3]),
  attachments: [],
  isRemoved: false
}));

// --- Studies, Roles, Test Groups --------------------------------------------
const studies: MockRow[] = [
  ["STD-001", "6-Month Accelerated Stability", "ST-ACC-6M", 0],
  ["STD-002", "Long Term Stability 24M", "ST-LT-24M", 0],
  ["STD-003", "Method Transfer — Assay", "ST-MT-AS", 1],
  ["STD-004", "Container Closure Integrity", "ST-CCI", 2]
].map(([studyId, name, studyCode, projectIndex]) => ({
  id: newId(),
  studyId,
  name,
  studyCode,
  details: `${name} — study protocol`,
  group: ref(groupIds[Number(projectIndex) % 4], String(groups[Number(projectIndex) % 4].name)),
  project: ref(String(projects[Number(projectIndex)].id), String(projects[Number(projectIndex)].name)),
  projectDetails: String(projects[Number(projectIndex)].details),
  supervisor: ref(newId(), "A. Shah"),
  attachments: [],
  isRemoved: false
}));

// --- Permissions — seeded, read-only catalog served by /lims-permissions --------
// Mirrors how the real backend would seed this table (see
// backend/src/migrations/012-seed-initial-data.ts for the pattern): one row per
// LIMS_PERMISSIONS entry. Roles only ever pick a subset of it; nothing here is
// created or edited from the UI.
export const limsPermissionCatalog: MockRow[] = Object.values(LIMS_PERMISSIONS).map((name) => ({
  id: newId(),
  name,
  description: `Grants ${String(name)}`
}));

const permissionRef = (name: string) => {
  const permission = limsPermissionCatalog.find((p) => p.name === name);
  return permission ? ref(String(permission.id), String(permission.name)) : null;
};

const roles: MockRow[] = [
  ["ROLE-001", "Lab Analyst"],
  ["ROLE-002", "Lab Supervisor"],
  ["ROLE-003", "QA Reviewer"],
  ["ROLE-004", "Read Only"]
].map(([roleId, name], index) => ({
  id: newId(),
  roleId,
  name,
  description: `${name} role`,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  permissions: [
    permissionRef(LIMS_PERMISSIONS.VIEW_SAMPLE),
    permissionRef(LIMS_PERMISSIONS.VIEW_TEST),
    permissionRef(LIMS_PERMISSIONS.VIEW_RESULT),
    ...(index > 0
      ? [
          permissionRef(LIMS_PERMISSIONS.CREATE_SAMPLE),
          permissionRef(LIMS_PERMISSIONS.UPDATE_SAMPLE)
        ]
      : []),
    ...(index > 1 ? [permissionRef(LIMS_PERMISSIONS.DELETE_SAMPLE)] : [])
  ].filter((entry): entry is { id: string; name: string } => entry !== null),
  isRemoved: false
}));

const testGroups: MockRow[] = [
  ["TG-001", "Finished Product Release"],
  ["TG-002", "Raw Material Identity"],
  ["TG-003", "Stability Pull Point"],
  ["TG-004", "Water Testing"]
].map(([testGroupId, name], index) => ({
  id: newId(),
  testGroupId,
  name,
  description: `${name} test panel`,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  tests: ["Assay", "Dissolution", "Water Content", "Appearance"]
    .slice(0, index + 1)
    .map((testName) => ({
      testName,
      instrumentCategory: "Chromatography",
      instrumentType: "HPLC",
      instrument: "HPLC-01",
      replicateCount: 2
    })),
  isRemoved: false
}));

// --- Equipment, inventory, testing definitions ------------------------------
const instrumentStatus = (n: string) =>
  ref(phraseEntries.INSTRUMENT_STATUS.find((e) => e.name === n)?.id ?? newId(), n);
const stockType = (n: string) =>
  ref(phraseEntries.STOCK_TYPE.find((e) => e.name === n)?.id ?? newId(), n);

const instruments: MockRow[] = [
  ["INS-001", "HPLC-01", "Available"],
  ["INS-002", "HPLC-02", "In Calibration"],
  ["INS-003", "GC-01", "Available"],
  ["INS-004", "Balance AB-204", "Available"],
  ["INS-005", "Dissolution Apparatus", "Out of Service"],
  ["INS-006", "FTIR Spectrometer", "Available"]
].map(([instrumentId, name, status], index) => ({
  id: newId(), instrumentId, name,
  description: `${name} laboratory instrument`,
  status: instrumentStatus(status),
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  location: null, supplier: null, type: null, measurementType: null,
  manufacturer: "Agilent", serialNumber: `SN-${1000 + index}`,
  modelNumber: `MDL-${index + 1}`, sopReference: `SOP-INS-${index + 1}`,
  parameters: [], maintenance: [], attachments: [], isRemoved: false
}));

const instrumentParts: MockRow[] = [
  ["PRT-001", "HPLC Column C18"],
  ["PRT-002", "Detector Lamp"],
  ["PRT-003", "Injector Needle"],
  ["PRT-004", "Pump Seal Kit"]
].map(([partId, partName], index) => ({
  id: newId(), partId, partName,
  description: `${partName} spare part`,
  status: instrumentStatus("Available"),
  instrument: ref(String(instruments[index % instruments.length].id), String(instruments[index % instruments.length].name)),
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  location: null, supplier: null,
  manufacturer: "Agilent", serialNumber: `PSN-${200 + index}`, modelNumber: `PM-${index}`,
  maintenance: [], attachments: [], isRemoved: false
}));

const calibrations: MockRow[] = [
  ["CAL-001", "HPLC-01 Annual Calibration", "Yearly"],
  ["CAL-002", "Balance Daily Check", "Daily"],
  ["CAL-003", "GC-01 Monthly Verification", "Monthly"]
].map(([calibrationId, calibrationName, plan], index) => ({
  id: newId(), calibrationId, calibrationName, plan,
  instrument: ref(String(instruments[index].id), String(instruments[index].name)),
  calibrationType: null, status: null, owner: null,
  planTime: "08:00", leadTimeValue: 2, leadTimeUnit: "Day",
  contractor: "Agilent Services", autoLogin: index === 0,
  lastMaintenanceDate: "2026-01-15", nextMaintenanceDate: "2027-01-15",
  isRemoved: false
}));

const users: MockRow[] = [
  ["A. Shah", "a.shah@lab.example"],
  ["R. Mehta", "r.mehta@lab.example"],
  ["P. Nair", "p.nair@lab.example"],
  ["S. Iyer", "s.iyer@lab.example"]
].map(([name, email], index) => ({
  id: newId(),
  // LIMS does not create users — it grants an existing platform user access.
  user: ref(newId(), String(name)),
  email,
  description: "Laboratory personnel",
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  location: null,
  accessGroups: [ref(groupIds[index % 4], String(groups[index % 4].name))],
  roles: [],
  trainingCompleted: index < 3,
  signature: "",
  isRemoved: false
}));

const stocks: MockRow[] = [
  ["STK-001", "Acetonitrile", "Solvent", "L"],
  ["STK-002", "Methanol", "Solvent", "L"],
  ["STK-003", "Paracetamol RS", "Reference Standard", "mg"],
  ["STK-004", "Buffer pH 7", "Reagent", "L"],
  ["STK-005", "Sodium Hydroxide", "Reagent", "kg"]
].map(([stockId, stockName, type, unit], index) => ({
  id: newId(), stockId, stockName, unit,
  description: `${stockName} laboratory stock`,
  stockType: stockType(type),
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  operator: null, defaultLocation: null, preferredSupplier: null, suppliers: [],
  targetAmount: 50, lowAmount: 5, lowPercentage: 10, inventory: 20 + index,
  parameters: [], attachments: [], isRemoved: false
}));

const stockBatches: MockRow[] = stocks.slice(0, 4).map((stock, index) => ({
  id: newId(),
  stock: ref(String(stock.id), String(stock.stockName)),
  batchNumber: index + 1,
  stockBatchId: `${stock.stockId}/${index + 1}`,
  description: `Batch ${index + 1} of ${stock.stockName}`,
  status: null, project: null, supplier: null, location: null,
  manufacturingDate: "2026-01-10", expiryDate: "2027-01-10",
  supplierBatchNumber: `SB-${300 + index}`, sapBatchId: `SAP-${index}`,
  internalBatchId: `INT-${index}`,
  initialAmount: 10, currentAmount: 7, unit: String(stock.unit),
  consumptions: [], parameters: [], attachments: [], isRemoved: false
}));

const aliquots: MockRow[] = stockBatches.slice(0, 3).map((batch, index) => ({
  id: newId(),
  aliquotSetId: `ALQ-00${index + 1}`,
  stockBatch: ref(String(batch.id), String(batch.stockBatchId)),
  aliquotsNumber: index + 2,
  aliquots: Array.from({ length: index + 2 }, (_, i) => ({
    aliquotId: `A${i + 1}`, description: "", quantity: 1, unit: String(batch.unit)
  })),
  isRemoved: false
}));

const inspectionPlans: MockRow[] = [
  ["INSP-001", "Standard Review", "Linear"],
  ["INSP-002", "Peer Round Robin", "Round robin"]
].map(([inspectionId, name, inspectionType], index) => ({
  id: newId(), inspectionId, name, inspectionType,
  description: `${name} inspection plan`,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  personnel: [{ inspectionType: "User", person: "A. Shah", role: "" }],
  details: "", isRemoved: false
}));

const analyses: MockRow[] = [
  ["ANL-001", "Assay by HPLC"],
  ["ANL-002", "Dissolution"],
  ["ANL-003", "Water Content (KF)"],
  ["ANL-004", "Appearance"]
].map(([analysisId, name], index) => ({
  id: newId(), analysisId, name,
  description: `${name} analytical method`,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  analysisType: null, approvalStatus: null,
  inspectionPlan: ref(String(inspectionPlans[index % 2].id), String(inspectionPlans[index % 2].name)),
  sopReference: `SOP-ANL-${index + 1}`,
  components: [
    { componentId: "C1", name: "Result", type: "Numeric", unit: "%", min: "95", max: "105" }
  ],
  details: "", isRemoved: false
}));

const specifications: MockRow[] = [
  ["SPEC-001", "Finished Product Spec"],
  ["SPEC-002", "Raw Material Spec"],
  ["SPEC-003", "Stability Spec"]
].map(([specId, name], index) => ({
  id: newId(), specId, name,
  description: `${name} acceptance criteria`,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  limits: [
    { analysisName: "Assay by HPLC", componentName: "Result", min: "95", max: "105" }
  ],
  attachments: [], isRemoved: false
}));

// --- Lab Executions ---------------------------------------------------------
const samples: MockRow[] = [
  ["SMP-0001", "Metformin ER Batch A"],
  ["SMP-0002", "Metformin ER Batch B"],
  ["SMP-0003", "Purified Water WS-1"],
  ["SMP-0004", "Amoxicillin RM Lot 22"],
  ["SMP-0005", "Paracetamol Stability 3M"],
  ["SMP-0006", "Excipient Lactose"]
].map(([sampleId, sampleName], index) => ({
  id: newId(), sampleId, sampleName,
  idNumeric: 1000 + index, idText: `S${1000 + index}`,
  description: `${sampleName} sample`,
  project: null, sampleType: null, specification: null, testGroup: null,
  location: null, group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  stockBatch: null, lotNumber: `L-${index + 1}`, serialNumber: `SR-${index + 1}`,
  loginDate: "2026-08-01", loginBy: "A. Shah",
  sampleStartDate: "2026-08-02", sampleStartBy: "R. Mehta",
  comments: "", testWindows: [], attachments: [], isRemoved: false
}));

const lots: MockRow[] = [
  ["LOT-001", "QC Release Lot 1"],
  ["LOT-002", "Stability Pull 3M"],
  ["LOT-003", "Water Monitoring Weekly"]
].map(([lotId, lotName], index) => ({
  id: newId(), lotId, lotName,
  description: `${lotName} lot`,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  samples: samples.slice(index, index + 2).map((sm) => ref(String(sm.id), String(sm.sampleName))),
  attachments: [], isRemoved: false
}));

const batches: MockRow[] = [
  ["BAT-001", "August Release Batch"],
  ["BAT-002", "Stability Batch Q3"]
].map(([batchId, batchName], index) => ({
  id: newId(), batchId, batchName,
  description: `${batchName} batch`,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  lots: lots.slice(index, index + 2).map((lt) => ref(String(lt.id), String(lt.lotName))),
  attachments: [], isRemoved: false
}));

const tests: MockRow[] = [
  ["TST-0001", "Assay by HPLC"],
  ["TST-0002", "Dissolution"],
  ["TST-0003", "Water Content (KF)"],
  ["TST-0004", "Appearance"],
  ["TST-0005", "pH"]
].map(([testId, testName], index) => ({
  id: newId(), testId, testName,
  sample: ref(String(samples[index % samples.length].id), String(samples[index % samples.length].sampleName)),
  analysis: null, instrument: null,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  replicateCount: 2, loginDate: "2026-08-02", loginBy: "A. Shah",
  description: "", components: [], attachments: [], isRemoved: false
}));

const results: MockRow[] = tests.slice(0, 4).map((test, index) => ({
  id: newId(),
  resultId: `RES-000${index + 1}`,
  test: ref(String(test.id), String(test.testName)),
  sample: test.sample,
  analysis: null, instrument: null, stock: null,
  componentId: "C1", componentName: "Result",
  value: String(98 + index), unit: "%", version: 1,
  enteredOn: "2026-08-03", enteredBy: "R. Mehta",
  outOfRange: false, isRemoved: false
}));

// --- Schedulers -------------------------------------------------------------
const schedulers: MockRow[] = [
  ["SCH-001", "Daily Water Sampling", "Sample", "Daily"],
  ["SCH-002", "Monthly Stability Pull", "Sample", "Monthly"],
  ["SCH-003", "Weekly Assay Test", "Test", "Daily"],
  ["SCH-004", "Quarterly Result Review", "Result", "Monthly"]
].map(([schedulerId, name, scope, plan], index) => ({
  id: newId(), schedulerId, name, scope, plan,
  description: `${name} recurring schedule`,
  group: ref(groupIds[index % 4], String(groups[index % 4].name)),
  project: null, analysis: null, testGroup: null, specification: null,
  sampleType: null, owner: null,
  planTime: "06:00", leadTimeValue: 1, leadTimeUnit: "Day",
  lastRunDate: "2026-08-01", nextRunDate: "2026-08-09",
  generatedCount: 12 * (index + 1),
  autoLogin: true, isActive: index !== 3, isRemoved: false
}));

// --- Storage Locations ------------------------------------------------------
/** Index 1 is seeded as removed so it sits on page 1 for the "show removed" toggle. */
const REMOVED_INDEX = 1;

const LOCATION_SEED: [code: string, name: string, type: string, group: number][] = [
  ["LOC-001", "Cold Room A", "Storage Room", 0],
  ["LOC-000", "Decommissioned Freezer", "Freezer", 0],
  ["LOC-002", "Cold Room B", "Storage Room", 0],
  ["LOC-003", "Freezer -20°C", "Freezer", 0],
  ["LOC-004", "Freezer -80°C", "Freezer", 1],
  ["LOC-005", "Reagent Cabinet 1", "Cabinet", 0],
  ["LOC-006", "Reagent Cabinet 2", "Cabinet", 1],
  ["LOC-007", "Sample Fridge QC", "Refrigerator", 0],
  ["LOC-008", "Sample Fridge R&D", "Refrigerator", 1],
  ["LOC-009", "Stability Chamber 25°C", "Storage Room", 3],
  ["LOC-010", "Stability Chamber 40°C", "Storage Room", 3],
  ["LOC-011", "Micro Incubator 37°C", "Storage Room", 2],
  ["LOC-012", "Solvent Store", "Storage Room", 0],
  ["LOC-013", "Flammables Cabinet", "Cabinet", 0],
  ["LOC-014", "Retention Sample Room", "Storage Room", 3],
  ["LOC-015", "Shelf A1", "Shelf", 0],
  ["LOC-016", "Shelf A2", "Shelf", 0],
  ["LOC-017", "Shelf B1", "Shelf", 1],
  ["LOC-018", "Quarantine Area", "Storage Room", 0],
  ["LOC-019", "Dispensing Booth", "Storage Room", 0],
  ["LOC-020", "Archive Store", "Storage Room", 3],
  ["LOC-021", "Media Prep Room", "Storage Room", 2],
  ["LOC-022", "Sterility Suite", "Storage Room", 2],
  ["LOC-023", "Waste Holding Area", "Storage Room", 0]
];

const locationIds = LOCATION_SEED.map(() => newId());

const locations: MockRow[] = LOCATION_SEED.map(([code, name, type, groupIndex], index) => ({
  id: locationIds[index],
  locationId: code,
  locationName: name,
  description: `${name} storage area`,
  // Relations come back nested as { id, label } — the shape the spec requires.
  locationType: ref(
    phraseEntries.LOCATION_TYPE.find((e) => e.name === type)?.id ?? newId(),
    type
  ),
  group: ref(groupIds[groupIndex], String(groups[groupIndex].name)),
  parentLocation: index > 14 ? ref(locationIds[0], "Cold Room A", "locationName") : null,
  subLocations: index === 0 ? [ref(locationIds[16], "Shelf A2", "locationName")] : [],
  otherInformation: "",
  attachments: [],
  // One row starts removed so the "Show removed" toggle has something to reveal.
  isRemoved: index === REMOVED_INDEX
}));

export const registerLimsFixtures = () => {
  registerEntity({
    route: "lims-locations",
    dataKey: "locations",
    uniqueField: "locationId",
    labelField: "locationName",
    searchFields: ["locationId", "locationName", "description"],
    rows: locations
  });

  registerEntity({
    route: "lims-parameters",
    dataKey: "parameters",
    uniqueField: "parameterId",
    labelField: "parameterName",
    searchFields: ["parameterId", "parameterName", "unit"],
    rows: parameters
  });

  registerEntity({
    route: "lims-phrases",
    dataKey: "phrases",
    uniqueField: "phrase",
    labelField: "name",
    searchFields: ["phrase", "name", "description"],
    rows: phrases
  });

  registerEntity({
    route: "lims-suppliers",
    dataKey: "suppliers",
    uniqueField: "supplierId",
    labelField: "supplierName",
    searchFields: ["supplierId", "supplierName", "contactName", "email"],
    rows: suppliers
  });

  registerEntity({
    route: "lims-customers",
    dataKey: "customers",
    uniqueField: "customerId",
    labelField: "customerName",
    searchFields: ["customerId", "customerName", "contactName", "email"],
    rows: customers
  });

  registerEntity({
    route: "lims-projects",
    dataKey: "projects",
    uniqueField: "projectId",
    labelField: "name",
    searchFields: ["projectId", "name", "code"],
    rows: projects
  });

  registerEntity({
    route: "lims-studies",
    dataKey: "studies",
    uniqueField: "studyId",
    labelField: "name",
    searchFields: ["studyId", "name", "studyCode"],
    rows: studies
  });

  registerEntity({
    route: "lims-roles",
    dataKey: "roles",
    uniqueField: "roleId",
    labelField: "name",
    searchFields: ["roleId", "name", "description"],
    rows: roles
  });

  registerEntity({
    route: "lims-test-groups",
    dataKey: "testGroups",
    uniqueField: "testGroupId",
    labelField: "name",
    searchFields: ["testGroupId", "name", "description"],
    rows: testGroups
  });

  registerEntity({
    route: "lims-instruments",
    dataKey: "instruments",
    uniqueField: "instrumentId",
    labelField: "name",
    searchFields: ["instrumentId", "name", "serialNumber"],
    rows: instruments
  });

  registerEntity({
    route: "lims-instrument-parts",
    dataKey: "instrumentParts",
    uniqueField: "partId",
    labelField: "partName",
    searchFields: ["partId", "partName", "serialNumber"],
    rows: instrumentParts
  });

  registerEntity({
    route: "lims-calibrations",
    dataKey: "calibrations",
    uniqueField: "calibrationId",
    labelField: "calibrationName",
    searchFields: ["calibrationId", "calibrationName"],
    rows: calibrations
  });

  registerEntity({
    route: "lims-users",
    dataKey: "users",
    uniqueField: "id",
    labelField: "id",
    searchFields: ["email"],
    rows: users
  });

  registerEntity({
    route: "lims-stocks",
    dataKey: "stocks",
    uniqueField: "stockId",
    labelField: "stockName",
    searchFields: ["stockId", "stockName", "unit"],
    rows: stocks
  });

  registerEntity({
    route: "lims-stock-batches",
    dataKey: "stockBatches",
    uniqueField: "stockBatchId",
    labelField: "stockBatchId",
    searchFields: ["stockBatchId", "supplierBatchNumber"],
    rows: stockBatches
  });

  registerEntity({
    route: "lims-aliquots",
    dataKey: "aliquots",
    uniqueField: "aliquotSetId",
    labelField: "aliquotSetId",
    searchFields: ["aliquotSetId"],
    rows: aliquots
  });

  registerEntity({
    route: "lims-inspection-plans",
    dataKey: "inspectionPlans",
    uniqueField: "inspectionId",
    labelField: "name",
    searchFields: ["inspectionId", "name"],
    rows: inspectionPlans
  });

  registerEntity({
    route: "lims-analyses",
    dataKey: "analyses",
    uniqueField: "analysisId",
    labelField: "name",
    searchFields: ["analysisId", "name"],
    rows: analyses
  });

  registerEntity({
    route: "lims-specifications",
    dataKey: "specifications",
    uniqueField: "specId",
    labelField: "name",
    searchFields: ["specId", "name"],
    rows: specifications
  });

  registerEntity({
    route: "lims-samples",
    dataKey: "samples",
    uniqueField: "sampleId",
    labelField: "sampleName",
    searchFields: ["sampleId", "sampleName", "idText"],
    rows: samples
  });

  registerEntity({
    route: "lims-lots",
    dataKey: "lots",
    uniqueField: "lotId",
    labelField: "lotName",
    searchFields: ["lotId", "lotName"],
    rows: lots
  });

  registerEntity({
    route: "lims-batches",
    dataKey: "batches",
    uniqueField: "batchId",
    labelField: "batchName",
    searchFields: ["batchId", "batchName"],
    rows: batches
  });

  registerEntity({
    route: "lims-tests",
    dataKey: "tests",
    uniqueField: "testId",
    labelField: "testName",
    searchFields: ["testId", "testName"],
    rows: tests
  });

  registerEntity({
    route: "lims-results",
    dataKey: "results",
    uniqueField: "resultId",
    labelField: "componentName",
    searchFields: ["resultId", "componentName"],
    rows: results
  });

  registerEntity({
    route: "lims-schedulers",
    dataKey: "schedulers",
    uniqueField: "schedulerId",
    labelField: "name",
    searchFields: ["schedulerId", "name", "scope"],
    rows: schedulers
  });

  registerEntity({
    route: "lims-groups",
    dataKey: "groups",
    uniqueField: "groupId",
    labelField: "name",
    searchFields: ["groupId", "name", "description"],
    rows: groups
  });

  // Registered so their endpoints answer before their modules are built.
  const pending: [route: string, dataKey: string, unique: string, label: string][] = [
    ["lims-aliquots", "aliquots", "id", "id"],
  ];

  pending.forEach(([route, dataKey, uniqueField, labelField]) =>
    registerEntity({
      route,
      dataKey,
      uniqueField,
      labelField,
      searchFields: [labelField, uniqueField],
      rows: []
    })
  );
};
