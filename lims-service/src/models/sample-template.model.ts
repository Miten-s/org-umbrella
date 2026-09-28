import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** Saved defaults for new Sample forms. Sample name/ID and Stock Batch are never templated. */
export interface ISampleTemplate {
  id?: string;
  sampleTemplateId: string;
  name: string;
  sampleTypeId?: string | null;
  projectId?: string | null;
  specificationId?: string | null;
  locationId?: string | null;
  groupId?: string | null;
  lotNumber?: string | null;
  serialNumber?: string | null;
  loginDate?: Date | null;
  loginBy?: string | null;
  sampleStartDate?: Date | null;
  sampleStartBy?: string | null;
  description?: string | null;
  comments?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class SampleTemplate
  extends Model<ISampleTemplate>
  implements ISampleTemplate
{
  public id!: string;
  public sampleTemplateId!: string;
  public name!: string;
  public sampleTypeId!: string | null;
  public projectId!: string | null;
  public specificationId!: string | null;
  public locationId!: string | null;
  public groupId!: string | null;
  public lotNumber!: string | null;
  public serialNumber!: string | null;
  public loginDate!: Date | null;
  public loginBy!: string | null;
  public sampleStartDate!: Date | null;
  public sampleStartBy!: string | null;
  public description!: string | null;
  public comments!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

SampleTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    sampleTemplateId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      field: "sample_template_id"
    },
    name: { type: DataTypes.STRING(200), allowNull: false },
    sampleTypeId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "sample_type_id"
    },
    projectId: { type: DataTypes.UUID, allowNull: true, field: "project_id" },
    specificationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "specification_id"
    },
    locationId: { type: DataTypes.UUID, allowNull: true, field: "location_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    lotNumber: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: "lot_number"
    },
    serialNumber: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: "serial_number"
    },
    loginDate: { type: DataTypes.DATE, allowNull: true, field: "login_date" },
    loginBy: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "login_by"
    },
    sampleStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "sample_start_date"
    },
    sampleStartBy: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "sample_start_by"
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    comments: { type: DataTypes.TEXT, allowNull: true },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_deleted"
    },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "deleted_by"
    },
    modifiedBy: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "modified_by"
    }
  },
  {
    sequelize,
    tableName: "lims_sample_templates",
    underscored: true,
    timestamps: true
  }
);

export default SampleTemplate;
