import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A replaceable Part of an Instrument. Same field set as its parent minus
 * MSA/parameters, per the spec's "everything same as Instrument".
 */
export interface IInstrumentPart {
  id?: string;
  partId: string;
  partName: string;
  description?: string | null;
  instrumentId: string;
  statusId?: string | null;
  locationId?: string | null;
  supplierId?: string | null;
  dateInstalled?: string | null;
  sopReference?: string | null;
  manufacturer?: string | null;
  serialNumber?: string | null;
  modelNumber?: string | null;
  measuringInformation?: string | null;
  details?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class InstrumentPart extends Model<IInstrumentPart> implements IInstrumentPart {
  public id!: string;
  public partId!: string;
  public partName!: string;
  public description!: string | null;
  public instrumentId!: string;
  public statusId!: string | null;
  public locationId!: string | null;
  public supplierId!: string | null;
  public dateInstalled!: string | null;
  public sopReference!: string | null;
  public manufacturer!: string | null;
  public serialNumber!: string | null;
  public modelNumber!: string | null;
  public measuringInformation!: string | null;
  public details!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

InstrumentPart.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    partId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "part_id" },
    partName: { type: DataTypes.STRING(200), allowNull: false, field: "part_name" },
    description: { type: DataTypes.TEXT, allowNull: true },
    instrumentId: { type: DataTypes.UUID, allowNull: false, field: "instrument_id" },
    statusId: { type: DataTypes.UUID, allowNull: true, field: "status_id" },
    locationId: { type: DataTypes.UUID, allowNull: true, field: "location_id" },
    supplierId: { type: DataTypes.UUID, allowNull: true, field: "supplier_id" },
    dateInstalled: { type: DataTypes.DATEONLY, allowNull: true, field: "date_installed" },
    sopReference: { type: DataTypes.STRING(200), allowNull: true, field: "sop_reference" },
    manufacturer: { type: DataTypes.STRING(200), allowNull: true },
    serialNumber: { type: DataTypes.STRING(150), allowNull: true, field: "serial_number" },
    modelNumber: { type: DataTypes.STRING(150), allowNull: true, field: "model_number" },
    measuringInformation: { type: DataTypes.TEXT, allowNull: true, field: "measuring_information" },
    details: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_instrument_parts", underscored: true, timestamps: true }
);

export default InstrumentPart;
