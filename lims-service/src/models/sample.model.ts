import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A Sample. `sampleId` is always server-generated (spec: "ID Numeric (Auto
 * Increment)") and cannot be edited afterwards.
 */
export interface ISample {
  id?: string;
  sampleId: string;
  idNumeric?: string | number | null;
  idText?: string | null;
  sampleName?: string | null;
  lotId?: string | null;
  projectId?: string | null;
  sampleTypeId?: string | null;
  specificationId?: string | null;
  testGroupId?: string | null;
  locationId?: string | null;
  stockBatchId?: string | null;
  lotNumber?: string | null;
  serialNumber?: string | null;
  loginDate?: Date | string | null;
  loginBy?: string | null;
  sampleStartDate?: Date | string | null;
  sampleStartBy?: string | null;
  description?: string | null;
  comments?: string | null;
  status: string;
  cancelledAt?: Date | null;
  cancelledBy?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Sample extends Model<ISample> implements ISample {
  public id!: string;
  public sampleId!: string;
  public idNumeric!: string | number | null;
  public idText!: string | null;
  public sampleName!: string | null;
  public lotId!: string | null;
  public projectId!: string | null;
  public sampleTypeId!: string | null;
  public specificationId!: string | null;
  public testGroupId!: string | null;
  public locationId!: string | null;
  public stockBatchId!: string | null;
  public lotNumber!: string | null;
  public serialNumber!: string | null;
  public loginDate!: Date | string | null;
  public loginBy!: string | null;
  public sampleStartDate!: Date | string | null;
  public sampleStartBy!: string | null;
  public description!: string | null;
  public comments!: string | null;
  public status!: string;
  public cancelledAt!: Date | null;
  public cancelledBy!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Sample.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    sampleId: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "sample_id" },
    idNumeric: { type: DataTypes.BIGINT, allowNull: true, field: "id_numeric" },
    idText: { type: DataTypes.STRING(255), allowNull: true, field: "id_text" },
    sampleName: { type: DataTypes.STRING(200), allowNull: true, field: "sample_name" },
    lotId: { type: DataTypes.UUID, allowNull: true, field: "lot_id" },
    projectId: { type: DataTypes.UUID, allowNull: true, field: "project_id" },
    sampleTypeId: { type: DataTypes.UUID, allowNull: true, field: "sample_type_id" },
    specificationId: { type: DataTypes.UUID, allowNull: true, field: "specification_id" },
    testGroupId: { type: DataTypes.UUID, allowNull: true, field: "test_group_id" },
    locationId: { type: DataTypes.UUID, allowNull: true, field: "location_id" },
    stockBatchId: { type: DataTypes.UUID, allowNull: true, field: "stock_batch_id" },
    lotNumber: { type: DataTypes.STRING(150), allowNull: true, field: "lot_number" },
    serialNumber: { type: DataTypes.STRING(150), allowNull: true, field: "serial_number" },
    loginDate: { type: DataTypes.DATE, allowNull: true, field: "login_date" },
    loginBy: { type: DataTypes.STRING(200), allowNull: true, field: "login_by" },
    sampleStartDate: { type: DataTypes.DATE, allowNull: true, field: "sample_start_date" },
    sampleStartBy: { type: DataTypes.STRING(200), allowNull: true, field: "sample_start_by" },
    description: { type: DataTypes.TEXT, allowNull: true },
    comments: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "Open" },
    cancelledAt: { type: DataTypes.DATE, allowNull: true, field: "cancelled_at" },
    cancelledBy: { type: DataTypes.STRING(100), allowNull: true, field: "cancelled_by" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_samples", underscored: true, timestamps: true }
);

export default Sample;
