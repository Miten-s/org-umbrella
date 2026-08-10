import PhraseEntry from "./phrase-entry.model";
import Group from "./group.model";
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";
import Analysis from "./analysis.model";

export interface IAnalysisComponent {
  id?: string;
  analysisId: string;
  name: string;
  componentTypePhraseId: string;
  unitPhraseId?: string | null;
  sortOrder: number;
  isRequired: boolean;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  modifiedBy?: string | null;
}

export class AnalysisComponent extends Model<IAnalysisComponent> implements IAnalysisComponent {
  public id!: string;

public analysisId!: string;
  public name!: string;
  public componentTypePhraseId!: string;
  public unitPhraseId!: string | null;
  public sortOrder!: number;
  public isRequired!: boolean;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;

}

AnalysisComponent.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    analysisId: { type: DataTypes.UUID, allowNull: false, field: "analysis_id" },
    name: { type: DataTypes.STRING(200), allowNull: false },
    componentTypePhraseId: { type: DataTypes.UUID, allowNull: false, field: "component_type_phrase_id" },
    unitPhraseId: { type: DataTypes.UUID, allowNull: true, field: "unit_phrase_id" },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: "sort_order" },
    isRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_required" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {  type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,  field: "is_deleted" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.UUID, allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.UUID, allowNull: true, field: "modified_by" }
  },
  {
    sequelize,
    tableName: "lims_analysis_components",
    underscored: true,
    timestamps: true,
    paranoid: false
  }
);

Analysis.hasMany(AnalysisComponent, { foreignKey: "analysis_id", as: "components" });
AnalysisComponent.belongsTo(Analysis, { foreignKey: "analysis_id", as: "analysis" });

// ─── Auto-generated associations ───
AnalysisComponent.belongsTo(Group, { foreignKey: "group_id", targetKey: "id", as: "group" });
AnalysisComponent.belongsTo(PhraseEntry, { foreignKey: "unit_phrase_id", targetKey: "id", as: "unitPhrase" });
AnalysisComponent.belongsTo(PhraseEntry, { foreignKey: "component_type_phrase_id", targetKey: "id", as: "componentTypePhrase" });

export default AnalysisComponent;
