import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

export class CsvSignature extends Model {
  public id!: string;
  public entityType!: string;
  public entityId!: string;
  public signerId!: string;
  public signatureMeaning!: string;
  public signedAt!: Date;
  public checksumHash!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CsvSignature.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "entity_type"
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "entity_id"
    },
    signerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "signer_id"
    },
    signatureMeaning: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "signature_meaning"
    },
    signedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "signed_at"
    },
    checksumHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: "checksum_hash"
    }
  },
  {
    sequelize,
    tableName: "csv_signatures",
    underscored: true
  }
);

export default CsvSignature;
