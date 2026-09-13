import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export type CsvAuditAction =
  "CREATE" | "UPDATE" | "DELETE" | "SIGN" | "EXECUTE";

export class CsvAuditLog extends Model {
  public id!: string;
  public entityName!: string;
  public entityId!: string;
  public action!: CsvAuditAction;
  public oldData!: object | null;
  public newData!: object | null;
  public userId!: string | null;
  public readonly createdAt!: Date;
}

CsvAuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entityName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "entity_name"
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "entity_id"
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    oldData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "old_data"
    },
    newData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "new_data"
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "user_id"
    }
  },
  {
    sequelize,
    tableName: "csv_audit_logs",
    underscored: true,
    updatedAt: false
  }
);

export default CsvAuditLog;
