import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * One row of the Parameters grid on an Instrument.
 */
export interface IInstrumentParameterValue {
  id?: string;
  instrumentId: string;
  identity?: string | null;
  value?: string | null;
  unit?: string | null;
}

export class InstrumentParameterValue extends Model<IInstrumentParameterValue> implements IInstrumentParameterValue {
  public id!: string;
  public instrumentId!: string;
  public identity!: string | null;
  public value!: string | null;
  public unit!: string | null;
}

InstrumentParameterValue.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    instrumentId: { type: DataTypes.UUID, allowNull: false, field: "instrument_id" },
    identity: { type: DataTypes.STRING(200), allowNull: true },
    value: { type: DataTypes.STRING(255), allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true }
  },
  { sequelize, tableName: "lims_instrument_parameter_values", underscored: true, timestamps: true }
);

export default InstrumentParameterValue;
