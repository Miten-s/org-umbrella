const bcrypt = require("bcrypt");

module.exports = {
  async up(db) {
    const permissions = [
      { name: "CREATE:USER", description: "Create a new user" },
      { name: "VIEW:USER", description: "Read user data" },
      { name: "UPDATE:USER", description: "Update user information" },
      { name: "DELETE:USER", description: "Delete a user" },
      { name: "CREATE:PERMISSION", description: "Create a new permission" },
      { name: "VIEW:PERMISSION", description: "Read permission data" },
      { name: "UPDATE:PERMISSION", description: "Update permission details" },
      { name: "DELETE:PERMISSION", description: "Delete a permission" },
      { name: "VIEW:DASHBOARD", description: "View the dashboard" },
      { name: "OPERATE:ALL", description: "Operate on all resources" },
      { name: "CREATE:LOCATION", description: "Create a new location" },
      { name: "VIEW:LOCATION", description: "Read location data" },
      { name: "UPDATE:LOCATION", description: "Update location details" },
      { name: "DELETE:LOCATION", description: "Delete a location" },
      { name: "CREATE:DEPARTMENT", description: "Create a new department" },
      { name: "VIEW:DEPARTMENT", description: "Read department data" },
      { name: "UPDATE:DEPARTMENT", description: "Update department details" },
      { name: "DELETE:DEPARTMENT", description: "Delete a department" },
      { name: "CREATE:DESIGNATION", description: "Create a new designation" },
      { name: "VIEW:DESIGNATION", description: "Read designation data" },
      { name: "UPDATE:DESIGNATION", description: "Update designation details" },
      { name: "DELETE:DESIGNATION", description: "Delete a designation" },
      { name: "CREATE:ROLE", description: "Create a new role" },
      { name: "VIEW:ROLE", description: "Read role data" },
      { name: "UPDATE:ROLE", description: "Update role details" },
      { name: "DELETE:ROLE", description: "Delete a role" }
    ];

    // 1. Insert Permissions
    const insertedPermissions = await db.collection("permissions").insertMany(
      permissions.map((permission) => ({
        ...permission,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }))
    );

    console.log("Permissions inserted");

    const operateAllPermissionId = Object.values(
      insertedPermissions.insertedIds
    ).find((_id, index) => permissions[index].name === "OPERATE:ALL");

    if (!operateAllPermissionId) {
      throw new Error("OPERATE:ALL permission not found");
    }

    // 2. Create Super Admin Role
    const roleInsertResult = await db.collection("roles").insertOne({
      name: "Super Admin",
      type: "Built_In",
      permissions: [operateAllPermissionId],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
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
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null
    });

    console.log("Super Admin user created");

    await db.collection("company").insertOne({
      name: "Super Admin Company",
      logo: null,
      description: "Super Admin Company",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    db.users.createIndex(
      { email: 1 },
      {
        unique: true,
        partialFilterExpression: { deletedAt: null }
      }
    );
    console.log("Company created");
  },

  async down(db) {
    // Remove Super Admin User
    await db.collection("users").deleteOne({ username: "superadmin" });

    // Remove Super Admin Role
    await db.collection("roles").deleteOne({ name: "Super Admin" });

    // Remove Permissions
    const permissionNames = [
      "CREATE:USER",
      "VIEW:USER",
      "UPDATE:USER",
      "DELETE:USER",
      "CREATE:PERMISSION",
      "VIEW:PERMISSION",
      "UPDATE:PERMISSION",
      "DELETE:PERMISSION",
      "VIEW:DASHBOARD",
      "OPERATE:ALL",
      "CREATE:LOCATION",
      "VIEW:LOCATION",
      "UPDATE:LOCATION",
      "DELETE:LOCATION",
      "CREATE:DEPARTMENT",
      "VIEW:DEPARTMENT",
      "UPDATE:DEPARTMENT",
      "DELETE:DEPARTMENT",
      "CREATE:DESIGNATION",
      "VIEW:DESIGNATION",
      "UPDATE:DESIGNATION",
      "DELETE:DESIGNATION",
      "CREATE:ROLE",
      "VIEW:ROLE",
      "UPDATE:ROLE",
      "DELETE:ROLE"
    ];

    await db
      .collection("permissions")
      .deleteMany({ name: { $in: permissionNames } });

    await db.collection("company").deleteOne({ name: "Super Admin Company" });

    console.log("Super Admin user, role, and permissions removed");
  }
};
