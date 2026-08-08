import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Location from "./location.model";
import Supplier from "./supplier.model";

export interface IInstrument {
  id?: string;
  name: string;
  description?: string | null;
  locationId?: string | null;
  supplierId?: string | null;
  serialNumber?: string | null;
  statusPhraseId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Instrument extends Model<IInstrument> implements IInstrument {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public locationId!: string | null;
  public supplierId!: string | null;
  public serialNumber!: string | null;
  public statusPhraseId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
}

Instrument.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    locationId: { type: DataTypes.UUID, allowNull: true, field: "location_id" },
    supplierId: { type: DataTypes.UUID, allowNull: true, field: "supplier_id" },
    serialNumber: { type: DataTypes.STRING(100), allowNull: true, field: "serial_number" },
    statusPhraseId: { type: DataTypes.UUID, allowNull: true, field: "status_phrase_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" }
  },
  {
    sequelize,
    tableName: "lims_instruments",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Location.hasMany(Instrument, { foreignKey: "location_id", as: "instruments" });
Instrument.belongsTo(Location, { foreignKey: "location_id", as: "location" });

Supplier.hasMany(Instrument, { foreignKey: "supplier_id", as: "instruments" });
Instrument.belongsTo(Supplier, { foreignKey: "supplier_id", as: "supplier" });

export default Instrument;
