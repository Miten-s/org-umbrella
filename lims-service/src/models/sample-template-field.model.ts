import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** One sample field a Sample Template uses, with the name its samples show it under.
 * The default value lives in the matching column on the template. */
export interface ISampleTemplateField {
  id?: string;
  sampleTemplateId: string;
  fieldKey: string;
  displayName?: string | null;
  sortOrder?: number | null;
}

export class SampleTemplateField
  extends Model<ISampleTemplateField>
  implements ISampleTemplateField
{
  public id!: string;
  public sampleTemplateId!: string;
  public fieldKey!: string;
  public displayName!: string | null;
  public sortOrder!: number | null;
}

SampleTemplateField.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    sampleTemplateId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "sample_template_id"
    },
    fieldKey: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "field_key"
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "display_name"
    },
    sortOrder: { type: DataTypes.INTEGER, allowNull: true, field: "sort_order" }
  },
  {
    sequelize,
    tableName: "lims_sample_template_fields",
    underscored: true,
    timestamps: true
  }
);

export default SampleTemplateField;
