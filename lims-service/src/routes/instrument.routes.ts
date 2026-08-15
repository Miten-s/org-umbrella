import Instrument from "../models/instrument.model";
import InstrumentPart from "../models/instrument-part.model";
import InstrumentParameterValue from "../models/instrument-parameter-value.model";
import MaintenanceRecord from "../models/maintenance-record.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import Location from "../models/location.model";
import Supplier from "../models/supplier.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateInstrumentDto, UpdateInstrumentDto } from "../dtos/instrument.dto";

/** Instruments, with their Parameters and Maintenance grids nested. */
export const instrumentConfig: CrudConfig<Instrument> = {
  model: Instrument,
  entityName: "Instrument",
  permissionEntity: "INSTRUMENT",
  uniqueField: "instrumentId",
  businessId: { field: "instrumentId", prefix: "INS" },
  searchFields: ["instrumentId", "name", "serialNumber", "modelNumber", "manufacturer"],
  defaultSortBy: "name",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: PhraseEntry, as: "type", attributes: ["id", "phraseEntryId", "name"], required: false },
    { model: PhraseEntry, as: "measurementType", attributes: ["id", "phraseEntryId", "name"], required: false },
    { model: PhraseEntry, as: "status", attributes: ["id", "phraseEntryId", "name"], required: false },
    { model: Location, as: "location", attributes: ["id", "locationId", "locationName"], required: false },
    { model: Supplier, as: "supplier", attributes: ["id", "supplierId", "supplierName"], required: false },
    { model: InstrumentPart, as: "parts", attributes: ["id", "partId", "partName"], required: false },
    { model: InstrumentParameterValue, as: "parameters", required: false },
    { model: MaintenanceRecord, as: "maintenance", required: false }
  ],
  relationFields: {
    group: "groupId",
    type: "typeId",
    measurementType: "measurementTypeId",
    status: "statusId",
    location: "locationId",
    supplier: "supplierId"
  },
  children: [
    {
      field: "parameters",
      model: InstrumentParameterValue,
      foreignKey: "instrumentId",
      fields: ["identity", "value", "unit"],
      matchKey: "identity"
    },
    {
      field: "maintenance",
      model: MaintenanceRecord,
      foreignKey: "instrumentId",
      fields: ["maintenanceName", "performedOn", "performedBy", "remarks"],
      matchKey: "maintenanceName"
    }
  ]
};

const service = buildCrudService(instrumentConfig);

export default buildCrudRouter({
  service,
  entityName: instrumentConfig.entityName,
  permissionEntity: instrumentConfig.permissionEntity,
  createDto: CreateInstrumentDto,
  updateDto: UpdateInstrumentDto,
  model: Instrument,
  businessId: instrumentConfig.businessId
});
