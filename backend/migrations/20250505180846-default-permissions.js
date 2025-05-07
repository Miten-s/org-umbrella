const { ObjectId } = require("mongoose").Types;

module.exports = {
  async up(db, client) {
    // Assuming organizationId is provided as a constant or fetched from somewhere
    const organization = new ObjectId("68190121bbd4203f51d97751"); // Todo : Replace with the actual organization ID

    // Define default permissions for CRUD actions on User and Permission (Uppercase with colon)
    const permissions = [
      { name: "CREATE:USER", description: "Create a new user" },
      { name: "READ:USER", description: "Read user data" },
      { name: "UPDATE:USER", description: "Update user information" },
      { name: "DELETE:USER", description: "Delete a user" },
      { name: "CREATE:PERMISSION", description: "Create a new permission" },
      { name: "READ:PERMISSION", description: "Read permission data" },
      { name: "UPDATE:PERMISSION", description: "Update permission details" },
      { name: "DELETE:PERMISSION", description: "Delete a permission" },
    ];

    // Insert default permissions into the 'permissions' collection
    await db
      .collection("permissions")
      .insertMany(
        permissions.map((permission) => ({
          ...permission,
          organization,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
        }))
      );

    console.log("Default permissions have been added with organizationId");
  },

  async down(db, client) {
    // Optionally, you can define a rollback process to remove these permissions
    const permissionNames = [
      "CREATE:USER",
      "READ:USER",
      "UPDATE:USER",
      "DELETE:USER",
      "CREATE:PERMISSION",
      "READ:PERMISSION",
      "UPDATE:PERMISSION",
      "DELETE:PERMISSION",
    ];

    await db
      .collection("permissions")
      .deleteMany({ name: { $in: permissionNames } });

    console.log("Default permissions have been removed");
  },
};
