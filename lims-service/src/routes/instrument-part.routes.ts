import InstrumentPart from "../models/instrument-part.model";
import Instrument from "../models/instrument.model";
import MaintenanceRecord from "../models/maintenance-record.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import Location from "../models/location.model";
import Supplier from "../models/supplier.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateInstrumentPartDto, UpdateInstrumentPartDto } from "../dtos/instrument.dto";

/** Instrument Parts. Its maintenance rows share a table with the instrument's. */
export const instrumentPartConfig: CrudConfig<InstrumentPart> = {
  model: InstrumentPart,
  entityName: "Instrument Part",
  permissionEntity: "INSTRUMENT_PART",
  uniqueField: "partId",
  businessId: { field: "partId", prefix: "PART" },
  searchFields: ["partId", "partName", "serialNumber", "modelNumber", "manufacturer"],
  defaultSortBy: "partName",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: Instrument, as: "instrument", attributes: ["id", "instrumentId", "name"], required: false },
    { model: PhraseEntry, as: "status", attributes: ["id", "phraseEntryId", "name"], required: false },
    { model: Location, as: "location", attributes: ["id", "locationId", "locationName"], required: false },
    { model: Supplier, as: "supplier", attributes: ["id", "supplierId", "supplierName"], required: false },
    { model: MaintenanceRecord, as: "maintenance", required: false }
  ],
  relationFields: {
    group: "groupId",
    instrument: "instrumentId",
    status: "statusId",
    location: "locationId",
    supplier: "supplierId"
  },
  children: [
    {
      field: "maintenance",
      model: MaintenanceRecord,
      foreignKey: "instrumentPartId",
      fields: ["maintenanceName", "performedOn", "performedBy", "remarks"],
      matchKey: "maintenanceName"
    }
  ]
};

const service = buildCrudService(instrumentPartConfig);

export default buildCrudRouter({
  service,
  entityName: instrumentPartConfig.entityName,
  permissionEntity: instrumentPartConfig.permissionEntity,
  createDto: CreateInstrumentPartDto,
  updateDto: UpdateInstrumentPartDto,
  model: InstrumentPart,
  businessId: instrumentPartConfig.businessId
});
