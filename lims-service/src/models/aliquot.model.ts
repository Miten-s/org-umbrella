import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One aliquot row inside an Aliquot Set.
 */
export interface IAliquot {
  id?: string;
  aliquotSetId: string;
  aliquotId?: string | null;
  description?: string | null;
  quantity?: string | number | null;
  unit?: string | null;
}

export class Aliquot extends Model<IAliquot> implements IAliquot {
  public id!: string;
  public aliquotSetId!: string;
  public aliquotId!: string | null;
  public description!: string | null;
  public quantity!: string | number | null;
  public unit!: string | null;
}

Aliquot.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    aliquotSetId: { type: DataTypes.UUID, allowNull: false, field: "aliquot_set_id" },
    aliquotId: { type: DataTypes.STRING(100), allowNull: true, field: "aliquot_id" },
    description: { type: DataTypes.TEXT, allowNull: true },
    quantity: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true }
  },
  { sequelize, tableName: "lims_aliquots", underscored: true, timestamps: true }
);

export default Aliquot;
