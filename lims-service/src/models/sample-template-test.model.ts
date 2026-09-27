import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** One Test Template a Sample Template assigns to the samples created from it. */
export interface ISampleTemplateTest {
  id?: string;
  sampleTemplateId: string;
  analysisId: string;
  sortOrder?: number | null;
}

export class SampleTemplateTest
  extends Model<ISampleTemplateTest>
  implements ISampleTemplateTest
{
  public id!: string;
  public sampleTemplateId!: string;
  public analysisId!: string;
  public sortOrder!: number | null;
}

SampleTemplateTest.init(
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
    analysisId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "analysis_id"
    },
    sortOrder: { type: DataTypes.INTEGER, allowNull: true, field: "sort_order" }
  },
  {
    sequelize,
    tableName: "lims_sample_template_tests",
    underscored: true,
    timestamps: true
  }
);

export default SampleTemplateTest;
