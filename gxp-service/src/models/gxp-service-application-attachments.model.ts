import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IAppAttachment {
  id?: string;
  applicationId: string;
  attachment: string;
  active: boolean;
  createdBy?: string | null;
}

export class AppAttachment extends Model<IAppAttachment> implements IAppAttachment {
  public id!: string;
  public applicationId!: string;
  public attachment!: string;
  public active!: boolean;
  public createdBy!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AppAttachment.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    applicationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "application_id"
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "created_by"
    }
  },
  {
    sequelize,
    tableName: "app_attachments",
    underscored: true,
    timestamps: true
  }
);
export default AppAttachment;
