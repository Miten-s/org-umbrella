const { ObjectId } = require("mongoose").Types;

module.exports = {
  async up(db, client) {
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
    ];

    // Fetch permission IDs by name
    const allPermissions = await db
      .collection("permissions")
      .find({ name: { $in: permissionNames } })
      .toArray();

    const permissionMap = new Map(
      allPermissions.map((perm) => [perm.name, perm._id])
    );

    const adminPermissionIds = permissionNames
      .map((name) => permissionMap.get(name))
      .filter(Boolean);
    const userPermissionIds = [permissionMap.get("VIEW:DASHBOARD")].filter(
      Boolean
    );

    // Insert Admin and User roles
    const roles = [
      {
        name: "Admin",
        type: "Built_In",
        permissions: adminPermissionIds,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "User",
        type: "Built_In",
        permissions: userPermissionIds,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("roles").insertMany(roles);
    console.log("Built-in Admin and User roles created with permissions");
  },

  async down(db, client) {
    await db.collection("roles").deleteMany({
      name: { $in: ["Admin", "User"] },
      type: "Built_In",
    });

    console.log("Built-in Admin and User roles removed");
  },
};
