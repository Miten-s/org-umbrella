import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import TestWindow from "./test-window.model";

export interface IResult {
  id?: string;
  testWindowId: string;
  version?: number;
  isLatest?: boolean;
  parentResultId?: string | null;
  numericValue?: number | null;
  textValue?: string | null;
  booleanValue?: boolean | null;
  dateValue?: Date | null;
  isOos?: boolean;
  enteredBy?: string | null;
  enteredAt?: Date | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class Result extends Model<IResult> implements IResult {
  public id!: string;

  public testWindowId!: string;
  public version!: number;
  public isLatest!: boolean;
  public parentResultId!: string | null;
  public numericValue!: number | null;
  public textValue!: string | null;
  public booleanValue!: boolean | null;
  public dateValue!: Date | null;
  public isOos!: boolean;
  public enteredBy!: string | null;
  public enteredAt!: Date | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

Result.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    testWindowId: { type: DataTypes.UUID, allowNull: false, field: "test_window_id" },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    isLatest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_latest" },
    parentResultId: { type: DataTypes.UUID, allowNull: true, field: "parent_result_id" },
    numericValue: { type: DataTypes.DECIMAL(18, 6), allowNull: true, field: "numeric_value" },
    textValue: { type: DataTypes.STRING(255), allowNull: true, field: "text_value" },
    booleanValue: { type: DataTypes.BOOLEAN, allowNull: true, field: "boolean_value" },
    dateValue: { type: DataTypes.DATE, allowNull: true, field: "date_value" },
    isOos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_oos" },
    enteredBy: { type: DataTypes.UUID, allowNull: true, field: "entered_by" },
    enteredAt: { type: DataTypes.DATE, allowNull: true, field: "entered_at" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_results",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

TestWindow.hasMany(Result, { foreignKey: "test_window_id", as: "results" });
Result.belongsTo(TestWindow, { foreignKey: "test_window_id", as: "testWindow" });

Result.hasMany(Result, { foreignKey: "parent_result_id", as: "versions" });
Result.belongsTo(Result, { foreignKey: "parent_result_id", as: "parentResult" });

// ─── Auto-generated associations ───
Result.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });

export default Result;
