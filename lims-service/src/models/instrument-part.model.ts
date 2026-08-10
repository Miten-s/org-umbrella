import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Instrument from "./instrument.model";

export interface IInstrumentPart {
  id?: string;
  instrumentId: string;
  partName: string;
  partNumber?: string | null;
  installationDate?: Date | null;
  expectedLifetimeDays?: number | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class InstrumentPart extends Model<IInstrumentPart> implements IInstrumentPart {
  public id!: string;

public instrumentId!: string;
  public partName!: string;
  public partNumber!: string | null;
  public installationDate!: Date | null;
  public expectedLifetimeDays!: number | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

InstrumentPart.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    instrumentId: { type: DataTypes.UUID, allowNull: false, field: "instrument_id" },
    partName: { type: DataTypes.STRING(200), allowNull: false, field: "part_name" },
    partNumber: { type: DataTypes.STRING(100), allowNull: true, field: "part_number" },
    installationDate: { type: DataTypes.DATE, allowNull: true, field: "installation_date" },
    expectedLifetimeDays: { type: DataTypes.INTEGER, allowNull: true, field: "expected_lifetime_days" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_instrument_parts",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Instrument.hasMany(InstrumentPart, { foreignKey: "instrument_id", as: "parts" });
InstrumentPart.belongsTo(Instrument, { foreignKey: "instrument_id", as: "instrument" });

// ─── Auto-generated associations ───
InstrumentPart.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });

export default InstrumentPart;
