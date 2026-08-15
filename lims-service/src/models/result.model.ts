import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Result. INSERT-ONLY — never updated in place.
 *
 * A correction inserts a new row with `version + 1` and `supersedesId` pointing
 * at the row it replaces; the old row keeps `isLatest = false` forever so the
 * originally entered value stays retrievable (21 CFR Part 11).
 */
export interface IResult {
  id?: string;
  resultId: string;
  testId: string;
  componentId?: string | null;
  componentName?: string | null;
  value?: string | null;
  unit?: string | null;
  outOfRange: boolean;
  instrumentId?: string | null;
  stockId?: string | null;
  enteredOn?: Date | string | null;
  enteredBy?: string | null;
  version: number;
  isLatest: boolean;
  supersedesId?: string | null;
  status: string;
  cancelledAt?: Date | null;
  cancelledBy?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Result extends Model<IResult> implements IResult {
  public id!: string;
  public resultId!: string;
  public testId!: string;
  public componentId!: string | null;
  public componentName!: string | null;
  public value!: string | null;
  public unit!: string | null;
  public outOfRange!: boolean;
  public instrumentId!: string | null;
  public stockId!: string | null;
  public enteredOn!: Date | string | null;
  public enteredBy!: string | null;
  public version!: number;
  public isLatest!: boolean;
  public supersedesId!: string | null;
  public status!: string;
  public cancelledAt!: Date | null;
  public cancelledBy!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Result.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    resultId: { type: DataTypes.STRING(100), allowNull: false, field: "result_id" },
    testId: { type: DataTypes.UUID, allowNull: false, field: "test_id" },
    componentId: { type: DataTypes.STRING(100), allowNull: true, field: "component_id" },
    componentName: { type: DataTypes.STRING(200), allowNull: true, field: "component_name" },
    value: { type: DataTypes.TEXT, allowNull: true },
    unit: { type: DataTypes.STRING(50), allowNull: true },
    outOfRange: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "out_of_range" },
    instrumentId: { type: DataTypes.UUID, allowNull: true, field: "instrument_id" },
    stockId: { type: DataTypes.UUID, allowNull: true, field: "stock_id" },
    enteredOn: { type: DataTypes.DATE, allowNull: true, field: "entered_on" },
    enteredBy: { type: DataTypes.STRING(200), allowNull: true, field: "entered_by" },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    isLatest: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_latest" },
    supersedesId: { type: DataTypes.UUID, allowNull: true, field: "supersedes_id" },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "Open" },
    cancelledAt: { type: DataTypes.DATE, allowNull: true, field: "cancelled_at" },
    cancelledBy: { type: DataTypes.STRING(100), allowNull: true, field: "cancelled_by" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_results", underscored: true, timestamps: true }
);

export default Result;
