import { Model, DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import { sequelize } from "../configs/db.sequelize";
import { Role } from "./role.model";
import { Department } from "./department.model";
import { Location } from "./location.model";
import { Designation } from "./designation.model";
import { UserPasswordHistory } from "./user-password-history.model";

export interface IUser {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  password?: string;
  userType?: "Admin" | "User";
  status?: "active" | "disabled";
  currentLanguage?: string;
  description?: string;
  phone?: string;
  departmentId?: string | null;
  designationId?: string | null;
  locationId?: string | null;
  managerId?: string | null;
  createdBy?: string | null;
  modifiedBy?: string | null;
  modifiable?: boolean;
  trainingCompleted?: boolean;
  passwordExpiryTime?: Date | null;
  lastLogin?: Date | null;
  signature?: string;
  deletedAt?: Date | null;
  modifiedOn?: Date | null;
}

export class User extends Model<IUser> implements IUser {
  public id!: string;
  public email!: string;
  public name!: string;
  public fullName!: string;
  public password!: string;
  public userType!: "Admin" | "User";
  public status!: "active" | "disabled";
  public currentLanguage!: string;
  public description!: string;
  public phone!: string;
  public departmentId!: string | null;
  public designationId!: string | null;
  public locationId!: string | null;
  public managerId!: string | null;
  public createdBy!: string | null;
  public modifiedBy!: string | null;
  public modifiable!: boolean;
  public trainingCompleted!: boolean;
  public passwordExpiryTime!: Date | null;
  public lastLogin!: Date | null;
  public signature!: string;
  public deletedAt!: Date | null;
  public modifiedOn!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public async isRecentPassword(password: string): Promise<boolean> {
    const history = await UserPasswordHistory.findAll({
      where: { userId: this.id },
      order: [["created_at", "DESC"]],
      limit: 3
    });

    for (const entry of history) {
      const match = await bcrypt.compare(password, entry.passwordHash);
      if (match) return true;
    }
    return false;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "full_name"
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "User",
      field: "user_type"
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active"
    },
    currentLanguage: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "en",
      field: "current_language"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "department_id",
      references: {
        model: "departments",
        key: "id"
      }
    },
    designationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "designation_id",
      references: {
        model: "designations",
        key: "id"
      }
    },
    locationId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "location_id",
      references: {
        model: "locations",
        key: "id"
      }
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "manager_id",
      references: {
        model: "users",
        key: "id"
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "created_by",
      references: {
        model: "users",
        key: "id"
      }
    },
    modifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "modified_by",
      references: {
        model: "users",
        key: "id"
      }
    },
    modifiable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    trainingCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "training_completed"
    },
    passwordExpiryTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "password_expiry_time"
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_login"
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at"
    },
    modifiedOn: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "modified_on"
    }
  },
  {
    sequelize,
    tableName: "users",
    underscored: true,
    timestamps: true,
    paranoid: true
  }
);

// Hashing Password before Save
User.beforeSave(async (user: User) => {
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    
    // Automatically set default Password Expiry Time 30 days
    user.passwordExpiryTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  }
  user.modifiedOn = new Date();
});

// Storing password hash in history after save
User.afterSave(async (user: User, options) => {
  if (user.changed("password")) {
    await UserPasswordHistory.create(
      {
        userId: user.id,
        passwordHash: user.password
      },
      { transaction: options.transaction }
    );
  }
});

// Associations Setup

// User Department Location Designation Relationships
User.belongsTo(Department, { foreignKey: "department_id", as: "department" });
Department.hasMany(User, { foreignKey: "department_id", as: "users" });

User.belongsTo(Location, { foreignKey: "location_id", as: "location" });
Location.hasMany(User, { foreignKey: "location_id", as: "users" });

User.belongsTo(Designation, { foreignKey: "designation_id", as: "designation" });
Designation.hasMany(User, { foreignKey: "designation_id", as: "users" });

// Self references (Manager, Creator, Modifier)
User.belongsTo(User, { foreignKey: "manager_id", as: "manager" });
User.belongsTo(User, { foreignKey: "created_by", as: "creator" });
User.belongsTo(User, { foreignKey: "modified_by", as: "modifier" });

export class UserRole extends Model {}
UserRole.init({
  user_id: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  role_id: {
    type: DataTypes.UUID,
    primaryKey: true
  }
}, {
  sequelize,
  tableName: "user_roles",
  timestamps: false,
  underscored: true
});

// Many-to-Many relationship with Role
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: "user_id",
  otherKey: "role_id",
  as: "roles"
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "role_id",
  otherKey: "user_id",
  as: "users"
});


// Department Manager Relationship (Circular reference resolved here)
Department.belongsTo(User, { foreignKey: "department_manager_id", as: "manager" });

export default User;
