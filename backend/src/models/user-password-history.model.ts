import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export interface IUserPasswordHistory {
  id?: number;
  userId: string;
  passwordHash: string;
}

export class UserPasswordHistory extends Model<IUserPasswordHistory> implements IUserPasswordHistory {
  public id!: number;
  public userId!: string;
  public passwordHash!: string;
  public readonly created_at!: Date;
}

UserPasswordHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id"
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "password_hash"
    }
  },
  {
    sequelize,
    tableName: "user_password_history",
    underscored: true,
    timestamps: true,
    updatedAt: false // Only created_at is needed
  }
);
export default UserPasswordHistory;
