const { ObjectId } = require("mongoose").Types;
const bcrypt = require("bcrypt");

module.exports = {
  async up(db, client) {
    const permissions = [
      { name: "CREATE:USER", description: "Create a new user" },
      { name: "READ:USER", description: "Read user data" },
      { name: "UPDATE:USER", description: "Update user information" },
      { name: "DELETE:USER", description: "Delete a user" },
      { name: "CREATE:PERMISSION", description: "Create a new permission" },
      { name: "READ:PERMISSION", description: "Read permission data" },
      { name: "UPDATE:PERMISSION", description: "Update permission details" },
      { name: "DELETE:PERMISSION", description: "Delete a permission" },
      { name: "VIEW:DASHBOARD", description: "View the dashboard" },
      { name: "OPERATE:ALL", description: "Operate on all resources" },
    ];

    // 1. Insert Permissions
    const insertedPermissions = await db.collection("permissions").insertMany(
      permissions.map((permission) => ({
        ...permission,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        deletedAt: null,
      }))
    );

    console.log("Permissions inserted");

    const operateAllPermissionId = Object.values(insertedPermissions.insertedIds).find(
      (_id, index) => permissions[index].name === "OPERATE:ALL"
    );

    if (!operateAllPermissionId) {
      throw new Error("OPERATE:ALL permission not found");
    }

    // 2. Create Super Admin Role
    const roleInsertResult = await db.collection("roles").insertOne({
      name: "Super Admin",
      description: "Has full access to all operations",
      type : "BUILT_IN",
      permissions: [operateAllPermissionId],
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      deletedAt: null,
    });

    const superAdminRoleId = roleInsertResult.insertedId;

    console.log("Super Admin role created");

    // 3. Create Super Admin User
    const password = await bcrypt.hash("SuperAdmin@123", 10);

    await db.collection("users").insertOne({
      username: "superadmin",
      email: "superadmin@example.com",
      name: "Super Admin",
      password,
      roles: [superAdminRoleId],
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
    });

    console.log("Super Admin user created");
  },

  async down(db, client) {
    // Remove Super Admin User
    await db.collection("users").deleteOne({ username: "superadmin" });

    // Remove Super Admin Role
    await db.collection("roles").deleteOne({ name: "Super Admin" });

    // Remove Permissions
    const permissionNames = [
      "CREATE:USER",
      "READ:USER",
      "UPDATE:USER",
      "DELETE:USER",
      "CREATE:PERMISSION",
      "READ:PERMISSION",
      "UPDATE:PERMISSION",
      "DELETE:PERMISSION",
      "VIEW:DASHBOARD",
      "OPERATE:ALL",
    ];

    await db
      .collection("permissions")
      .deleteMany({ name: { $in: permissionNames } });

    console.log("Super Admin user, role, and permissions removed");
  },
};
