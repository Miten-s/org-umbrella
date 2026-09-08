import Group from "./group.model";
import Role from "./role.model";
import RoleEntry from "./role-entry.model";
import LimsUser from "./lims-user.model";
import UserAccessGroup from "./user-access-group.model";
import UserRole from "./user-role.model";
import Phrase from "./phrase.model";
import PhraseEntry from "./phrase-entry.model";
import Location from "./location.model";
import Customer from "./customer.model";
import Supplier from "./supplier.model";
import Project from "./project.model";
import Study from "./study.model";
import Parameter from "./parameter.model";
import Stock from "./stock.model";
import StockSupplier from "./stock-supplier.model";
import StockParameterValue from "./stock-parameter-value.model";
import StockBatch from "./stock-batch.model";
import StockBatchConsumption from "./stock-batch-consumption.model";
import StockBatchParameterValue from "./stock-batch-parameter-value.model";
import AliquotSet from "./aliquot-set.model";
import Aliquot from "./aliquot.model";
import Instrument from "./instrument.model";
import InstrumentPart from "./instrument-part.model";
import InstrumentParameterValue from "./instrument-parameter-value.model";
import MaintenanceRecord from "./maintenance-record.model";
import Calibration from "./calibration.model";
import InspectionPlan from "./inspection-plan.model";
import InspectionPersonnel from "./inspection-personnel.model";
import Analysis from "./analysis.model";
import AnalysisComponent from "./analysis-component.model";
import TestGroup from "./test-group.model";
import TestGroupItem from "./test-group-item.model";
import Specification from "./specification.model";
import SpecLimit from "./spec-limit.model";
import Batch from "./batch.model";
import Lot from "./lot.model";
import Sample from "./sample.model";
import Test from "./test.model";
import Result from "./result.model";
import Scheduler from "./scheduler.model";
import TestWindow from "./test-window.model";

/** All model associations, registered once at boot — circular references make declaring
 * them at import time load-order-sensitive. `as` aliases must match `<Entity>.types.ts` field names. */
let registered = false;

export const registerAssociations = () => {
  if (registered) return;
  registered = true;

  // Group hierarchy — access to a parent cascades to its children.
  // Aliased `parentGroup` to match the client's payload field name.
  Group.belongsTo(Group, { as: "parentGroup", foreignKey: "parentGroupId" });
  Group.hasMany(Group, { as: "childGroups", foreignKey: "parentGroupId" });

  // Role → owning group (an ownership tag, not an access scope).
  Role.belongsTo(Group, { as: "group", foreignKey: "groupId" });

  // Role → its permission grants, returned nested as `entries[]`.
  Role.hasMany(RoleEntry, {
    as: "entries",
    foreignKey: "roleId",
    onDelete: "CASCADE"
  });
  RoleEntry.belongsTo(Role, { as: "role", foreignKey: "roleId" });

  // LimsUser → home group.
  LimsUser.belongsTo(Group, { as: "group", foreignKey: "groupId" });

  // LimsUser → the groups they may reach.
  LimsUser.belongsToMany(Group, {
    as: "accessGroups",
    through: UserAccessGroup,
    foreignKey: "limsUserId",
    otherKey: "groupId"
  });
  Group.belongsToMany(LimsUser, {
    as: "users",
    through: UserAccessGroup,
    foreignKey: "groupId",
    otherKey: "limsUserId"
  });

  // LimsUser → roles (permissions are the UNION across all of them).
  LimsUser.belongsToMany(Role, {
    as: "roles",
    through: UserRole,
    foreignKey: "limsUserId",
    otherKey: "roleId"
  });
  Role.belongsToMany(LimsUser, {
    as: "users",
    through: UserRole,
    foreignKey: "roleId",
    otherKey: "limsUserId"
  });

  // LimsUser → home location.
  LimsUser.belongsTo(Location, { as: "location", foreignKey: "locationId" });

  // ─── Master data ─────────────────────────────────────────────────────────

  // Pick list → its values, returned nested as `entries[]`.
  Phrase.hasMany(PhraseEntry, {
    as: "entries",
    foreignKey: "phraseId",
    onDelete: "CASCADE"
  });
  PhraseEntry.belongsTo(Phrase, { as: "phrase", foreignKey: "phraseId" });
  Phrase.belongsTo(Group, { as: "group", foreignKey: "groupId" });

  // Storage tree: Building → Room → Freezer → Shelf.
  Location.belongsTo(Location, {
    as: "parentLocation",
    foreignKey: "parentLocationId"
  });
  Location.hasMany(Location, {
    as: "subLocations",
    foreignKey: "parentLocationId"
  });
  Location.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  // The location's type is one value from the LOCATION_TYPE pick list.
  Location.belongsTo(PhraseEntry, {
    as: "locationType",
    foreignKey: "locationTypeId"
  });

  // ─── Commercial ──────────────────────────────────────────────────────────

  Customer.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Customer.belongsTo(PhraseEntry, { as: "rating", foreignKey: "ratingId" });
  // Read-only on the client: the projects pointing back at this customer.
  Customer.hasMany(Project, { as: "linkedProjects", foreignKey: "customerId" });

  Supplier.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Supplier.belongsTo(PhraseEntry, { as: "rating", foreignKey: "ratingId" });

  Project.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Project.belongsTo(Customer, { as: "customer", foreignKey: "customerId" });
  Project.belongsTo(LimsUser, { as: "supervisor", foreignKey: "supervisorId" });

  Study.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Study.belongsTo(Project, { as: "project", foreignKey: "projectId" });
  Study.belongsTo(LimsUser, { as: "supervisor", foreignKey: "supervisorId" });

  Parameter.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Parameter.belongsTo(PhraseEntry, {
    as: "parameterType",
    foreignKey: "parameterTypeId"
  });

  // ─── Stock ───────────────────────────────────────────────────────────────

  Stock.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Stock.belongsTo(PhraseEntry, { as: "stockType", foreignKey: "stockTypeId" });
  Stock.belongsTo(LimsUser, { as: "operator", foreignKey: "operatorId" });
  Stock.belongsTo(Location, {
    as: "defaultLocation",
    foreignKey: "defaultLocationId"
  });
  Stock.belongsTo(Supplier, {
    as: "preferredSupplier",
    foreignKey: "preferredSupplierId"
  });
  // The "multiple suppliers" field, distinct from the single preferred one.
  Stock.belongsToMany(Supplier, {
    as: "suppliers",
    through: StockSupplier,
    foreignKey: "stockId",
    otherKey: "supplierId"
  });
  Stock.hasMany(StockParameterValue, {
    as: "parameters",
    foreignKey: "stockId",
    onDelete: "CASCADE"
  });

  StockBatch.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  StockBatch.belongsTo(Stock, { as: "stock", foreignKey: "stockId" });
  StockBatch.belongsTo(PhraseEntry, { as: "status", foreignKey: "statusId" });
  StockBatch.belongsTo(Project, { as: "project", foreignKey: "projectId" });
  StockBatch.belongsTo(Supplier, { as: "supplier", foreignKey: "supplierId" });
  StockBatch.belongsTo(Location, { as: "location", foreignKey: "locationId" });
  StockBatch.hasMany(StockBatchConsumption, {
    as: "consumptions",
    foreignKey: "stockBatchId",
    onDelete: "CASCADE"
  });
  StockBatch.hasMany(StockBatchParameterValue, {
    as: "parameters",
    foreignKey: "stockBatchId",
    onDelete: "CASCADE"
  });
  Stock.hasMany(StockBatch, { as: "batches", foreignKey: "stockId" });

  AliquotSet.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  AliquotSet.belongsTo(StockBatch, {
    as: "stockBatch",
    foreignKey: "stockBatchId"
  });
  AliquotSet.hasMany(Aliquot, {
    as: "aliquots",
    foreignKey: "aliquotSetId",
    onDelete: "CASCADE"
  });

  // ─── Instruments ─────────────────────────────────────────────────────────

  Instrument.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Instrument.belongsTo(PhraseEntry, { as: "type", foreignKey: "typeId" });
  Instrument.belongsTo(PhraseEntry, {
    as: "measurementType",
    foreignKey: "measurementTypeId"
  });
  Instrument.belongsTo(PhraseEntry, { as: "status", foreignKey: "statusId" });
  Instrument.belongsTo(Location, { as: "location", foreignKey: "locationId" });
  Instrument.belongsTo(Supplier, { as: "supplier", foreignKey: "supplierId" });
  Instrument.hasMany(InstrumentParameterValue, {
    as: "parameters",
    foreignKey: "instrumentId",
    onDelete: "CASCADE"
  });
  Instrument.hasMany(MaintenanceRecord, {
    as: "maintenance",
    foreignKey: "instrumentId",
    onDelete: "CASCADE"
  });
  Instrument.hasMany(InstrumentPart, {
    as: "parts",
    foreignKey: "instrumentId"
  });

  InstrumentPart.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  InstrumentPart.belongsTo(Instrument, {
    as: "instrument",
    foreignKey: "instrumentId"
  });
  InstrumentPart.belongsTo(PhraseEntry, {
    as: "status",
    foreignKey: "statusId"
  });
  InstrumentPart.belongsTo(Location, {
    as: "location",
    foreignKey: "locationId"
  });
  InstrumentPart.belongsTo(Supplier, {
    as: "supplier",
    foreignKey: "supplierId"
  });
  InstrumentPart.hasMany(MaintenanceRecord, {
    as: "maintenance",
    foreignKey: "instrumentPartId",
    onDelete: "CASCADE"
  });

  Calibration.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Calibration.belongsTo(Instrument, {
    as: "instrument",
    foreignKey: "instrumentId"
  });
  Calibration.belongsTo(PhraseEntry, {
    as: "calibrationType",
    foreignKey: "calibrationTypeId"
  });
  Calibration.belongsTo(PhraseEntry, { as: "status", foreignKey: "statusId" });
  Calibration.belongsTo(LimsUser, { as: "owner", foreignKey: "ownerId" });
  Instrument.hasMany(Calibration, {
    as: "calibrations",
    foreignKey: "instrumentId"
  });

  InspectionPlan.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  InspectionPlan.hasMany(InspectionPersonnel, {
    as: "personnel",
    foreignKey: "inspectionPlanId",
    onDelete: "CASCADE"
  });
  InspectionPersonnel.belongsTo(LimsUser, {
    as: "person",
    foreignKey: "personId"
  });
  InspectionPersonnel.belongsTo(Role, { as: "role", foreignKey: "roleId" });

  // ─── Analytical definitions ──────────────────────────────────────────────

  Analysis.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Analysis.belongsTo(PhraseEntry, {
    as: "analysisType",
    foreignKey: "analysisTypeId"
  });
  Analysis.belongsTo(PhraseEntry, {
    as: "approvalStatus",
    foreignKey: "approvalStatusId"
  });
  Analysis.belongsTo(InspectionPlan, {
    as: "inspectionPlan",
    foreignKey: "inspectionPlanId"
  });
  Analysis.hasMany(AnalysisComponent, {
    as: "components",
    foreignKey: "analysisId",
    onDelete: "CASCADE"
  });
  AnalysisComponent.belongsTo(Analysis, {
    as: "analysis",
    foreignKey: "analysisId"
  });

  TestGroup.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  TestGroup.hasMany(TestGroupItem, {
    as: "tests",
    foreignKey: "testGroupId",
    onDelete: "CASCADE"
  });
  TestGroupItem.belongsTo(Instrument, {
    as: "instrument",
    foreignKey: "instrumentId"
  });

  Specification.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Specification.hasMany(SpecLimit, {
    as: "limits",
    foreignKey: "specificationId",
    onDelete: "CASCADE"
  });

  // ─── Lab executions ──────────────────────────────────────────────────────
  // Batch → Lot → Sample → Test → Result.

  Batch.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Batch.hasMany(Lot, { as: "lots", foreignKey: "batchId" });

  Lot.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Lot.belongsTo(Batch, { as: "batch", foreignKey: "batchId" });
  Lot.hasMany(Sample, { as: "samples", foreignKey: "lotId" });

  Sample.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Sample.belongsTo(Lot, { as: "lot", foreignKey: "lotId" });
  Sample.belongsTo(Project, { as: "project", foreignKey: "projectId" });
  Sample.belongsTo(PhraseEntry, {
    as: "sampleType",
    foreignKey: "sampleTypeId"
  });
  Sample.belongsTo(Specification, {
    as: "specification",
    foreignKey: "specificationId"
  });
  Sample.belongsTo(TestGroup, { as: "testGroup", foreignKey: "testGroupId" });
  Sample.belongsTo(Location, { as: "location", foreignKey: "locationId" });
  Sample.belongsTo(StockBatch, {
    as: "stockBatch",
    foreignKey: "stockBatchId"
  });
  Sample.hasMany(TestWindow, {
    as: "testWindows",
    foreignKey: "sampleId",
    onDelete: "CASCADE"
  });
  Sample.hasMany(Test, { as: "tests", foreignKey: "sampleId" });

  Test.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Test.belongsTo(Sample, { as: "sample", foreignKey: "sampleId" });
  Test.belongsTo(Analysis, { as: "analysis", foreignKey: "analysisId" });
  Test.belongsTo(Instrument, { as: "instrument", foreignKey: "instrumentId" });
  Test.hasMany(Result, { as: "results", foreignKey: "testId" });
  // Test's own result-entry grid — reuses TestWindow (see test.routes.ts).
  Test.hasMany(TestWindow, { as: "components", foreignKey: "testId" });

  Result.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Result.belongsTo(Test, { as: "test", foreignKey: "testId" });
  Result.belongsTo(Instrument, {
    as: "instrument",
    foreignKey: "instrumentId"
  });
  Result.belongsTo(Stock, { as: "stock", foreignKey: "stockId" });

  TestWindow.belongsTo(Sample, { as: "sample", foreignKey: "sampleId" });
  TestWindow.belongsTo(Test, { as: "test", foreignKey: "testId" });
  TestWindow.belongsTo(Instrument, {
    as: "instrument",
    foreignKey: "instrumentId"
  });
  TestWindow.belongsTo(Stock, { as: "stock", foreignKey: "stockId" });

  Scheduler.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  Scheduler.belongsTo(Project, { as: "project", foreignKey: "projectId" });
  Scheduler.belongsTo(Analysis, { as: "analysis", foreignKey: "analysisId" });
  Scheduler.belongsTo(TestGroup, {
    as: "testGroup",
    foreignKey: "testGroupId"
  });
  Scheduler.belongsTo(Specification, {
    as: "specification",
    foreignKey: "specificationId"
  });
  Scheduler.belongsTo(PhraseEntry, {
    as: "sampleType",
    foreignKey: "sampleTypeId"
  });
  Scheduler.belongsTo(LimsUser, { as: "owner", foreignKey: "ownerId" });
};

export default registerAssociations;
