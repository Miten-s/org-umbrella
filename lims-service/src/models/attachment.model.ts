import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

/**
 * A file attached to any entity. Polymorphic by `entityName` + `entityId` —
 * see migration 005 for why there is no foreign key to the parent.
 */
export interface IAttachment {
  id?: string;
  entityName: string;
  entityId: string;
  fileName: string;
  storedName: string;
  mimeType?: string | null;
  sizeBytes?: number;
  comment?: string | null;
  uploadedBy?: string | null;
  uploadedByName?: string | null;
  groupId?: string | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  modifiedBy?: string | null;
}

export class Attachment extends Model<IAttachment> implements IAttachment {
  public id!: string;
  public entityName!: string;
  public entityId!: string;
  public fileName!: string;
  public storedName!: string;
  public mimeType!: string | null;
  public sizeBytes!: number;
  public comment!: string | null;
  public uploadedBy!: string | null;
  public uploadedByName!: string | null;
  public groupId!: string | null;
  public isDeleted!: boolean;
  public deletedAt!: Date | null;
  public deletedBy!: string | null;
  public modifiedBy!: string | null;
}

Attachment.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    entityName: { type: DataTypes.STRING(50), allowNull: false, field: "entity_name" },
    entityId: { type: DataTypes.UUID, allowNull: false, field: "entity_id" },
    fileName: { type: DataTypes.STRING(255), allowNull: false, field: "file_name" },
    storedName: { type: DataTypes.STRING(255), allowNull: false, field: "stored_name" },
    mimeType: { type: DataTypes.STRING(150), allowNull: true, field: "mime_type" },
    sizeBytes: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0, field: "size_bytes" },
    comment: { type: DataTypes.TEXT, allowNull: true },
    uploadedBy: { type: DataTypes.STRING(100), allowNull: true, field: "uploaded_by" },
    uploadedByName: { type: DataTypes.STRING(200), allowNull: true, field: "uploaded_by_name" },
    groupId: { type: DataTypes.UUID, allowNull: true, field: "group_id" },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_deleted"
    },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
    deletedBy: { type: DataTypes.STRING(100), allowNull: true, field: "deleted_by" },
    modifiedBy: { type: DataTypes.STRING(100), allowNull: true, field: "modified_by" }
  },
  { sequelize, tableName: "lims_attachments", underscored: true, timestamps: true }
);

export default Attachment;
