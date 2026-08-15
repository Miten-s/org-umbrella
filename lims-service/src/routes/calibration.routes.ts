import Calibration from "../models/calibration.model";
import Instrument from "../models/instrument.model";
import Group from "../models/group.model";
import PhraseEntry from "../models/phrase-entry.model";
import LimsUser from "../models/lims-user.model";
import { buildCrudRouter, buildCrudService, CrudConfig } from "../utils/crud-factory";
import { CreateCalibrationDto, UpdateCalibrationDto } from "../dtos/instrument.dto";

/**
 * Calibrations and their schedules. `nextMaintenanceDate` is indexed because
 * the scheduler will sweep it to raise calibration samples when they fall due.
 */
export const calibrationConfig: CrudConfig<Calibration> = {
  model: Calibration,
  entityName: "Calibration",
  permissionEntity: "CALIBRATION",
  uniqueField: "calibrationId",
  businessId: { field: "calibrationId", prefix: "CAL" },
  searchFields: ["calibrationId", "calibrationName", "contractor"],
  defaultSortBy: "calibrationName",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    { model: Instrument, as: "instrument", attributes: ["id", "instrumentId", "name"], required: false },
    { model: PhraseEntry, as: "calibrationType", attributes: ["id", "phraseEntryId", "name"], required: false },
    { model: PhraseEntry, as: "status", attributes: ["id", "phraseEntryId", "name"], required: false },
    { model: LimsUser, as: "owner", attributes: ["id", "userName"], required: false }
  ],
  relationFields: {
    group: "groupId",
    instrument: "instrumentId",
    calibrationType: "calibrationTypeId",
    status: "statusId",
    owner: "ownerId"
  }
};

const service = buildCrudService(calibrationConfig);

export default buildCrudRouter({
  service,
  entityName: calibrationConfig.entityName,
  permissionEntity: calibrationConfig.permissionEntity,
  createDto: CreateCalibrationDto,
  updateDto: UpdateCalibrationDto,
  model: Calibration,
  businessId: calibrationConfig.businessId
});
