import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IWorkflow {
  id: string;
  workflowName: string;
  numberOfLevels: number;
  levels: string[];
  description?: string;
  createdOn?: Date;
  createdBy: string;
  modifiedOn?: Date;
  modifiedBy?: string;
  status: string;
}

export class Workflow extends Model<IWorkflow> implements IWorkflow {
  public id!: string;
  public workflowName!: string;
  public numberOfLevels!: number;
  public levels!: string[];
  public description!: string;
  public createdOn!: Date;
  public createdBy!: string;
  public modifiedOn!: Date;
  public modifiedBy!: string;
  public status!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Workflow.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    workflowName: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: "workflow_name"
    },
    numberOfLevels: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "number_of_levels"
    },
    levels: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    createdOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_on"
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "created_by"
    },
    modifiedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "modified_on"
    },
    modifiedBy: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: "modified_by"
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enabled"
    }
  },
  {
    sequelize,
    tableName: "workflows",
    underscored: true,
    timestamps: true
  }
);
export default Workflow;
