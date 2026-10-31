import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/** A saved set of conditions on one table. Components point at it; a test's analyst picks one
 * of the records it matches at that moment. */
export interface IEntityTemplate {
  id?: string;
  entityTemplateId: string;
  name: string;
  entity: string;
  query: Record<string, unknown>;
  description?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class EntityTemplate
  extends Model<IEntityTemplate>
  implements IEntityTemplate
{
  public id!: string;
  public entityTemplateId!: string;
  public name!: string;
  public entity!: string;
  public query!: Record<string, unknown>;
  public description!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

EntityTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    entityTemplateId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "entity_template_id"
    },
    name: { type: DataTypes.STRING(200), allowNull: false },
    entity: { type: DataTypes.STRING(50), allowNull: false },
    query: { type: DataTypes.JSONB, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
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
    tableName: "lims_entity_templates",
    underscored: true,
    timestamps: true
  }
);

export default EntityTemplate;
