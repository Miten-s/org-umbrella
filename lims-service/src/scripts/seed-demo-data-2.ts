/**
 * Seed 5 demo records into every remaining LIMS module (the 19 entities not
 * covered by seed-demo-data.ts: parameters, projects, studies, stocks, stock
 * batches, aliquots, instruments, instrument parts, calibrations, inspection
 * plans, analyses, test groups, specifications, batches, lots, samples,
 * tests, results, schedulers), chained together so the FK graph makes sense
 * (e.g. sample 3 sits in lot 3, which sits in batch 3).
 *
 * Run AFTER, in order:
 *   1. backend/src/scripts/seed-demo-data.ts
 *   2. lims-service/src/scripts/seed-demo-data.ts   (Demo Lab group + 5 lab users + core master data)
 *   3. lims-service/src/scripts/seed-phrases.ts     (pick lists most of these entities reference)
 *
 * One-off / manual — not wired into the auto-run migrations. Idempotent: safe
 * to re-run.
 *
 *   npx ts-node src/scripts/seed-demo-data-2.ts
 */
import "dotenv/config";
import crypto from "crypto";
import { sequelize } from "../configs/db.sequelize";
import { registerAssociations } from "../models/associations";
import Group from "../models/group.model";
import LimsUser from "../models/lims-user.model";
import Phrase from "../models/phrase.model";
import PhraseEntry from "../models/phrase-entry.model";
import Location from "../models/location.model";
import Customer from "../models/customer.model";
import Supplier from "../models/supplier.model";
import Parameter from "../models/parameter.model";
import Project from "../models/project.model";
import Study from "../models/study.model";
import Stock from "../models/stock.model";
import StockBatch from "../models/stock-batch.model";
import AliquotSet from "../models/aliquot-set.model";
import Aliquot from "../models/aliquot.model";
import Instrument from "../models/instrument.model";
import InstrumentPart from "../models/instrument-part.model";
import Calibration from "../models/calibration.model";
import InspectionPlan from "../models/inspection-plan.model";
import Analysis from "../models/analysis.model";
import TestGroup from "../models/test-group.model";
import Specification from "../models/specification.model";
import Batch from "../models/batch.model";
import Lot from "../models/lot.model";
import Sample from "../models/sample.model";
import Test from "../models/test.model";
import Result from "../models/result.model";
import Scheduler from "../models/scheduler.model";

// Same 5 platform users backend/src/scripts/seed-demo-data.ts creates — looked
// up here by the userName lims-service's own seed-demo-data.ts stamped on
// their lims_users row, since the platform id itself is a random UUIDV4 and
// can't be recomputed.
const DEMO_NAMES = ["Priya Sharma", "Arjun Mehta", "Sneha Reddy", "Vikram Rao", "Ananya Iyer"];

const run = async () => {
  await sequelize.authenticate();
  registerAssociations();

  const demoGroup = await Group.findOne({ where: { groupId: "DEMO_LAB" } });
  if (!demoGroup) {
    throw new Error("Demo Lab group not found — run lims-service's seed-demo-data.ts first.");
  }

  const labUsers = [];
  for (const name of DEMO_NAMES) {
    const limsUser = await LimsUser.findOne({ where: { userName: name } });
    if (!limsUser) throw new Error(`Lab user "${name}" not found — run seed-demo-data.ts first.`);
    labUsers.push(limsUser);
  }

  const customers = [];
  const suppliers = [];
  const locations = [];
  for (let i = 1; i <= 5; i++) {
    const n = String(i).padStart(3, "0");
    const customer = await Customer.findOne({ where: { customerId: `CUST-${n}` } });
    const supplier = await Supplier.findOne({ where: { supplierId: `SUP-${n}` } });
    const location = await Location.findOne({ where: { locationId: `LOC-${n}` } });
    if (!customer || !supplier || !location) {
      throw new Error("Core master data not found — run lims-service's seed-demo-data.ts first.");
    }
    customers.push(customer);
    suppliers.push(supplier);
    locations.push(location);
  }

  /** e.g. entryId("STOCK_TYPE", "Reagent") — same recipe as seed-phrases.ts. */
  const entryKey = (phrase: string, value: string) =>
    `${phrase}_${value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")}`;

  const phraseEntryId = async (phraseCode: string, entryName: string): Promise<string> => {
    const phrase = await Phrase.findOne({ where: { phrase: phraseCode } });
    if (!phrase) throw new Error(`Phrase ${phraseCode} not found — run seed-phrases.ts first.`);
    const entry = await PhraseEntry.findOne({
      where: { phraseId: phrase.id, phraseEntryId: entryKey(phraseCode, entryName) }
    });
    if (!entry) throw new Error(`Phrase entry ${phraseCode}/${entryName} not found.`);
    return entry.id;
  };

  const groupId = demoGroup.id;

  // ─── Parameters ──────────────────────────────────────────────────────────
  const PARAMETERS = [
    { name: "pH", type: "Numeric", unit: "pH" },
    { name: "Weight", type: "Numeric", unit: "g" },
    { name: "Notes", type: "Text", unit: null },
    { name: "Verified", type: "Boolean", unit: null },
    { name: "Grade", type: "Option", unit: null }
  ];
  const parameters = [];
  for (let i = 0; i < PARAMETERS.length; i++) {
    const p = PARAMETERS[i];
    const [row] = await Parameter.findOrCreate({
      where: { parameterId: `PARAM-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        parameterId: `PARAM-${String(i + 1).padStart(3, "0")}`,
        parameterName: p.name,
        parameterTypeId: await phraseEntryId("PARAMETER_TYPE", p.type),
        unit: p.unit ?? undefined,
        groupId
      }
    });
    parameters.push(row);
  }

  // ─── Projects ────────────────────────────────────────────────────────────
  const PROJECTS = [
    "Method Validation FY26",
    "Stability Study Q3",
    "Raw Material Qualification",
    "Cleaning Verification",
    "New Product Onboarding"
  ];
  const projects = [];
  for (let i = 0; i < PROJECTS.length; i++) {
    const [row] = await Project.findOrCreate({
      where: { projectId: `PROJ-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        projectId: `PROJ-${String(i + 1).padStart(3, "0")}`,
        name: PROJECTS[i],
        customerId: customers[i].id,
        supervisorId: labUsers[i].id,
        groupId
      }
    });
    projects.push(row);
  }

  // ─── Studies (one per project) ───────────────────────────────────────────
  const studies = [];
  for (let i = 0; i < projects.length; i++) {
    const [row] = await Study.findOrCreate({
      where: { studyId: `STUDY-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        studyId: `STUDY-${String(i + 1).padStart(3, "0")}`,
        name: `${projects[i].name} — Study 1`,
        projectId: projects[i].id,
        projectDetails: projects[i].name,
        supervisorId: labUsers[i].id,
        groupId
      }
    });
    studies.push(row);
  }

  // ─── Stocks ──────────────────────────────────────────────────────────────
  const STOCKS = [
    { name: "Acetonitrile HPLC Grade", type: "Solvent", unit: "mL" },
    { name: "Sodium Chloride AR Grade", type: "Reagent", unit: "g" },
    { name: "pH 7 Buffer Standard", type: "Standard", unit: "mL" },
    { name: "Ethanol 95%", type: "Solvent", unit: "mL" },
    { name: "Silica Gel Column", type: "Column", unit: "unit" }
  ];
  const stocks = [];
  for (let i = 0; i < STOCKS.length; i++) {
    const s = STOCKS[i];
    const [row] = await Stock.findOrCreate({
      where: { stockId: `STOCK-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        stockId: `STOCK-${String(i + 1).padStart(3, "0")}`,
        stockName: s.name,
        stockTypeId: await phraseEntryId("STOCK_TYPE", s.type),
        operatorId: labUsers[i].id,
        defaultLocationId: locations[i].id,
        preferredSupplierId: suppliers[i].id,
        unit: s.unit,
        groupId
      }
    });
    stocks.push(row);
  }

  // ─── Stock Batches (one per stock) ───────────────────────────────────────
  const BATCH_STATUSES = ["Available", "Quarantine", "In Use", "Expired", "Depleted"];
  const stockBatches = [];
  for (let i = 0; i < stocks.length; i++) {
    const [row] = await StockBatch.findOrCreate({
      where: { stockBatchId: `${stocks[i].stockId}/1` },
      defaults: {
        stockBatchId: `${stocks[i].stockId}/1`,
        batchNumber: 1,
        stockId: stocks[i].id,
        statusId: await phraseEntryId("STOCK_BATCH_STATUS", BATCH_STATUSES[i]),
        projectId: projects[i].id,
        supplierId: suppliers[i].id,
        locationId: locations[i].id,
        manufacturingDate: "2026-01-15",
        expiryDate: "2028-01-15",
        initialAmount: 1000,
        currentAmount: 850,
        unit: stocks[i].unit,
        groupId
      }
    });
    stockBatches.push(row);
  }

  // ─── Aliquot Sets + Aliquots (one set + one aliquot per stock batch) ────
  for (let i = 0; i < stockBatches.length; i++) {
    const [set] = await AliquotSet.findOrCreate({
      where: { aliquotSetId: `ALQ-SET-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        aliquotSetId: `ALQ-SET-${String(i + 1).padStart(3, "0")}`,
        stockBatchId: stockBatches[i].id,
        aliquotsNumber: 4,
        groupId
      }
    });

    await Aliquot.findOrCreate({
      where: { aliquotId: `${set.aliquotSetId}-A1` },
      defaults: {
        aliquotSetId: set.id,
        aliquotId: `${set.aliquotSetId}-A1`,
        quantity: 50,
        unit: stockBatches[i].unit ?? undefined
      }
    });
  }

  // ─── Instruments ─────────────────────────────────────────────────────────
  const INSTRUMENTS = [
    { name: "HPLC System 1", type: "HPLC", measurement: "Chromatographic", status: "Operational" },
    { name: "GC System 1", type: "GC", measurement: "Chromatographic", status: "Operational" },
    { name: "UV-Vis Spectrophotometer 1", type: "UV-Vis Spectrophotometer", measurement: "Spectroscopic", status: "Operational" },
    { name: "Analytical Balance 1", type: "Balance", measurement: "Gravimetric", status: "Operational" },
    { name: "pH Meter 1", type: "pH Meter", measurement: "Electrochemical", status: "Under Maintenance" }
  ];
  const instruments = [];
  for (let i = 0; i < INSTRUMENTS.length; i++) {
    const ins = INSTRUMENTS[i];
    const [row] = await Instrument.findOrCreate({
      where: { instrumentId: `INST-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        instrumentId: `INST-${String(i + 1).padStart(3, "0")}`,
        name: ins.name,
        typeId: await phraseEntryId("INSTRUMENT_TYPE", ins.type),
        measurementTypeId: await phraseEntryId("MEASUREMENT_TYPE", ins.measurement),
        statusId: await phraseEntryId("INSTRUMENT_STATUS", ins.status),
        locationId: locations[i].id,
        supplierId: suppliers[i].id,
        manufacturer: "Demo Instruments Co.",
        serialNumber: `SN-${1000 + i}`,
        modelNumber: `MDL-${100 + i}`,
        groupId
      }
    });
    instruments.push(row);
  }

  // ─── Instrument Parts (one per instrument) ──────────────────────────────
  const PARTS = ["Column - C18", "Injector Needle", "Deuterium Lamp", "Load Cell", "pH Electrode"];
  const instrumentParts = [];
  for (let i = 0; i < PARTS.length; i++) {
    const [row] = await InstrumentPart.findOrCreate({
      where: { partId: `PART-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        partId: `PART-${String(i + 1).padStart(3, "0")}`,
        partName: PARTS[i],
        instrumentId: instruments[i].id,
        statusId: await phraseEntryId("INSTRUMENT_STATUS", "Operational"),
        locationId: locations[i].id,
        supplierId: suppliers[i].id,
        groupId
      }
    });
    instrumentParts.push(row);
  }

  // ─── Calibrations (one per instrument) ──────────────────────────────────
  const CAL_TYPES = ["Internal", "External", "Preventive Maintenance", "Qualification", "Verification"];
  const CAL_STATUSES = ["Scheduled", "Due", "Passed", "Passed", "Scheduled"];
  for (let i = 0; i < instruments.length; i++) {
    await Calibration.findOrCreate({
      where: { calibrationId: `CAL-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        calibrationId: `CAL-${String(i + 1).padStart(3, "0")}`,
        calibrationName: `Annual Calibration — ${instruments[i].name}`,
        instrumentId: instruments[i].id,
        calibrationTypeId: await phraseEntryId("CALIBRATION_TYPE", CAL_TYPES[i]),
        statusId: await phraseEntryId("CALIBRATION_STATUS", CAL_STATUSES[i]),
        plan: "Yearly",
        ownerId: labUsers[i].id,
        lastMaintenanceDate: "2026-01-01",
        nextMaintenanceDate: "2027-01-01",
        autoLogin: false,
        groupId
      }
    });
  }

  // ─── Inspection Plans ────────────────────────────────────────────────────
  const INSPECTION_PLANS = [
    "Batch Release Review",
    "Method Validation Review",
    "OOS Investigation Review",
    "Stability Protocol Review",
    "Supplier Qualification Review"
  ];
  const inspectionPlans = [];
  for (let i = 0; i < INSPECTION_PLANS.length; i++) {
    const [row] = await InspectionPlan.findOrCreate({
      where: { inspectionId: `INSP-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        inspectionId: `INSP-${String(i + 1).padStart(3, "0")}`,
        name: INSPECTION_PLANS[i],
        inspectionType: i % 2 === 0 ? "Round robin" : "Linear",
        groupId
      }
    });
    inspectionPlans.push(row);
  }

  // ─── Analyses ────────────────────────────────────────────────────────────
  const ANALYSES = [
    { name: "Assay by HPLC", type: "Assay", approval: "Approved" },
    { name: "Related Substances", type: "Impurity", approval: "Approved" },
    { name: "Dissolution Test", type: "Dissolution", approval: "Approved" },
    { name: "Water Content (KF)", type: "Water Content", approval: "Approved" },
    { name: "Microbial Limit Test", type: "Microbiological", approval: "Draft" }
  ];
  const analyses = [];
  for (let i = 0; i < ANALYSES.length; i++) {
    const a = ANALYSES[i];
    const [row] = await Analysis.findOrCreate({
      where: { analysisId: `ANA-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        analysisId: `ANA-${String(i + 1).padStart(3, "0")}`,
        name: a.name,
        analysisTypeId: await phraseEntryId("ANALYSIS_TYPE", a.type),
        approvalStatusId: await phraseEntryId("APPROVAL_STATUS", a.approval),
        inspectionPlanId: inspectionPlans[i].id,
        groupId
      }
    });
    analyses.push(row);
  }

  // ─── Test Groups ─────────────────────────────────────────────────────────
  const TEST_GROUPS = [
    "Release Testing Panel",
    "Stability Testing Panel",
    "Raw Material Panel",
    "Environmental Monitoring Panel",
    "Cleaning Verification Panel"
  ];
  const testGroups = [];
  for (let i = 0; i < TEST_GROUPS.length; i++) {
    const [row] = await TestGroup.findOrCreate({
      where: { testGroupId: `TG-${String(i + 1).padStart(3, "0")}` },
      defaults: { testGroupId: `TG-${String(i + 1).padStart(3, "0")}`, name: TEST_GROUPS[i], groupId }
    });
    testGroups.push(row);
  }

  // ─── Specifications ──────────────────────────────────────────────────────
  const SPECIFICATIONS = [
    "USP Assay Limits",
    "Related Substances Limits",
    "Dissolution Acceptance Criteria",
    "Water Content Limits",
    "Microbial Limits"
  ];
  const specifications = [];
  for (let i = 0; i < SPECIFICATIONS.length; i++) {
    const [row] = await Specification.findOrCreate({
      where: { specId: `SPEC-${String(i + 1).padStart(3, "0")}` },
      defaults: { specId: `SPEC-${String(i + 1).padStart(3, "0")}`, name: SPECIFICATIONS[i], groupId }
    });
    specifications.push(row);
  }

  // ─── Batches → Lots → Samples → Tests → Results ─────────────────────────
  const SAMPLE_TYPES = ["Raw Material", "In-Process", "Finished Product", "Stability", "Retain"];
  const batches = [];
  const lots = [];
  const samples = [];
  const tests = [];
  for (let i = 0; i < 5; i++) {
    const n = String(i + 1).padStart(3, "0");

    const [batch] = await Batch.findOrCreate({
      where: { batchId: `BATCH-${n}` },
      defaults: { batchId: `BATCH-${n}`, batchName: `Batch 2026-${n}`, status: "Open", groupId }
    });
    batches.push(batch);

    const [lot] = await Lot.findOrCreate({
      where: { lotId: `LOT-${n}` },
      defaults: { lotId: `LOT-${n}`, lotName: `Lot 2026-${n}-A`, batchId: batch.id, status: "Open", groupId }
    });
    lots.push(lot);

    const [sample] = await Sample.findOrCreate({
      where: { sampleId: `SMP-${n}` },
      defaults: {
        sampleId: `SMP-${n}`,
        idNumeric: i + 1,
        sampleName: `Sample ${n}`,
        lotId: lot.id,
        projectId: projects[i].id,
        sampleTypeId: await phraseEntryId("SAMPLE_TYPE", SAMPLE_TYPES[i]),
        specificationId: specifications[i].id,
        testGroupId: testGroups[i].id,
        locationId: locations[i].id,
        stockBatchId: stockBatches[i].id,
        status: "Open",
        groupId
      }
    });
    samples.push(sample);

    const [test] = await Test.findOrCreate({
      where: { testId: `TEST-${n}` },
      defaults: {
        testId: `TEST-${n}`,
        testName: analyses[i].name,
        sampleId: sample.id,
        analysisId: analyses[i].id,
        instrumentId: instruments[i].id,
        status: "Open",
        groupId
      }
    });
    tests.push(test);

    await Result.findOrCreate({
      where: { resultId: `RES-${n}` },
      defaults: {
        resultId: `RES-${n}`,
        testId: test.id,
        componentId: "ASSAY",
        componentName: "Assay",
        value: (98 + i * 0.3).toFixed(2),
        unit: "%",
        outOfRange: false,
        instrumentId: instruments[i].id,
        enteredBy: labUsers[i].userName ?? undefined,
        version: 1,
        isLatest: true,
        status: "Open",
        groupId
      }
    });
  }

  // ─── Schedulers ──────────────────────────────────────────────────────────
  const SCHEDULERS = [
    { name: "Weekly Stability Pull", plan: "Weekly" },
    { name: "Monthly Calibration Check Sample", plan: "Monthly" },
    { name: "Daily Environmental Monitoring", plan: "Daily" },
    { name: "Quarterly Supplier Requalification", plan: "Quarterly" },
    { name: "Annual Method Revalidation", plan: "Yearly" }
  ];
  for (let i = 0; i < SCHEDULERS.length; i++) {
    const s = SCHEDULERS[i];
    await Scheduler.findOrCreate({
      where: { schedulerId: `SCHED-${String(i + 1).padStart(3, "0")}` },
      defaults: {
        schedulerId: `SCHED-${String(i + 1).padStart(3, "0")}`,
        name: s.name,
        scope: "Sample",
        projectId: projects[i].id,
        analysisId: analyses[i].id,
        testGroupId: testGroups[i].id,
        specificationId: specifications[i].id,
        sampleTypeId: await phraseEntryId("SAMPLE_TYPE", SAMPLE_TYPES[i]),
        ownerId: labUsers[i].id,
        plan: s.plan,
        generatedCount: 0,
        autoLogin: false,
        isActive: true,
        groupId
      }
    });
  }

  console.log(
    "\nSeeded 5 records each into: parameters, projects, studies, stocks, stock batches, aliquot " +
      "sets/aliquots, instruments, instrument parts, calibrations, inspection plans, analyses, " +
      "test groups, specifications, batches, lots, samples, tests, results, schedulers.\n"
  );

  await sequelize.close();
};

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
