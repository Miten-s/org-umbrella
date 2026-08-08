import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Test from "./test.model";
import AnalysisComponent from "./analysis-component.model";

export interface ITestWindow {
  id?: string;
  testId: string;
  analysisComponentId: string;
  statusPhraseId?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TestWindow extends Model<ITestWindow> implements ITestWindow {
  public id!: string;
  public testId!: string;
  public analysisComponentId!: string;
  public statusPhraseId!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
}

TestWindow.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    testId: { type: DataTypes.UUID, allowNull: false, field: "test_id" },
    analysisComponentId: { type: DataTypes.UUID, allowNull: false, field: "analysis_component_id" },
    statusPhraseId: { type: DataTypes.UUID, allowNull: true, field: "status_phrase_id" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" }
  },
  {
    sequelize,
    tableName: "lims_test_windows",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Test.hasMany(TestWindow, { foreignKey: "test_id", as: "testWindows" });
TestWindow.belongsTo(Test, { foreignKey: "test_id", as: "test" });

AnalysisComponent.hasMany(TestWindow, { foreignKey: "analysis_component_id", as: "testWindows" });
TestWindow.belongsTo(AnalysisComponent, { foreignKey: "analysis_component_id", as: "analysisComponent" });

export default TestWindow;
