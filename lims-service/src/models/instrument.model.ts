import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A laboratory Instrument. Its Parts, Parameters and Maintenance rows are
 * separate tables; Calibrations schedule work against it.
 */
export interface IInstrument {
  id?: string;
  instrumentId: string;
  name: string;
  description?: string | null;
  typeId?: string | null;
  measurementTypeId?: string | null;
  statusId?: string | null;
  locationId?: string | null;
  supplierId?: string | null;
  dateInstalled?: string | null;
  lastMsaDate?: string | null;
  sopReference?: string | null;
  manufacturer?: string | null;
  serialNumber?: string | null;
  modelNumber?: string | null;
  measuringInformation?: string | null;
  msaInformation?: string | null;
  details?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Instrument extends Model<IInstrument> implements IInstrument {
  public id!: string;
  public instrumentId!: string;
  public name!: string;
  public description!: string | null;
  public typeId!: string | null;
  public measurementTypeId!: string | null;
  public statusId!: string | null;
  public locationId!: string | null;
  public supplierId!: string | null;
  public dateInstalled!: string | null;
  public lastMsaDate!: string | null;
  public sopReference!: string | null;
  public manufacturer!: string | null;
  public serialNumber!: string | null;
  public modelNumber!: string | null;
  public measuringInformation!: string | null;
  public msaInformation!: string | null;
  public details!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Instrument.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    instrumentId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "instrument_id" },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    typeId: { type: DataTypes.UUID, allowNull: true, field: "type_id" },
    measurementTypeId: { type: DataTypes.UUID, allowNull: true, field: "measurement_type_id" },
    statusId: { type: DataTypes.UUID, allowNull: true, field: "status_id" },
    locationId: { type: DataTypes.UUID, allowNull: true, field: "location_id" },
    supplierId: { type: DataTypes.UUID, allowNull: true, field: "supplier_id" },
    dateInstalled: { type: DataTypes.DATEONLY, allowNull: true, field: "date_installed" },
    lastMsaDate: { type: DataTypes.DATEONLY, allowNull: true, field: "last_msa_date" },
    sopReference: { type: DataTypes.STRING(200), allowNull: true, field: "sop_reference" },
    manufacturer: { type: DataTypes.STRING(200), allowNull: true },
    serialNumber: { type: DataTypes.STRING(150), allowNull: true, field: "serial_number" },
    modelNumber: { type: DataTypes.STRING(150), allowNull: true, field: "model_number" },
    measuringInformation: { type: DataTypes.TEXT, allowNull: true, field: "measuring_information" },
    msaInformation: { type: DataTypes.TEXT, allowNull: true, field: "msa_information" },
    details: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_instruments", underscored: true, timestamps: true }
);

export default Instrument;
