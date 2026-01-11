// Added type to all permissions

const permissions = [
  { name: "GXP:CREATE:PERMISSION", description: "Create a permission" },
  { name: "GXP:VIEW:PERMISSION", description: "View permissions" },
  { name: "GXP:UPDATE:PERMISSION", description: "Update permission details" },
  { name: "GXP:DELETE:PERMISSION", description: "Delete a permission" },

  { name: "GXP:CREATE:ROLE", description: "Create a role" },
  { name: "GXP:VIEW:ROLE", description: "View roles" },
  { name: "GXP:UPDATE:ROLE", description: "Update role details" },
  { name: "GXP:DELETE:ROLE", description: "Delete a role" },

  { name: "GXP:CREATE:USER", description: "Create a user" },
  { name: "GXP:VIEW:USER", description: "View users" },
  { name: "GXP:UPDATE:USER", description: "Update user details" },
  { name: "GXP:DELETE:USER", description: "Delete a user" },

  {
    name: "GXP:CREATE:ASSIGNMENT_GROUP",
    description: "Create an assignment group"
  },
  {
    name: "GXP:VIEW:ASSIGNMENT_GROUP",
    description: "View assignment groups"
  },
  {
    name: "GXP:UPDATE:ASSIGNMENT_GROUP",
    description: "Update assignment group details"
  },
  {
    name: "GXP:DELETE:ASSIGNMENT_GROUP",
    description: "Delete an assignment group"
  },

  { name: "GXP:CREATE:WORKFLOW", description: "Create a workflow" },
  { name: "GXP:VIEW:WORKFLOW", description: "View workflows" },
  { name: "GXP:UPDATE:WORKFLOW", description: "Update workflow details" },
  { name: "GXP:DELETE:WORKFLOW", description: "Delete a workflow" },

  { name: "GXP:CREATE:ENVIRONMENT", description: "Create an environment" },
  { name: "GXP:VIEW:ENVIRONMENT", description: "View environments" },
  {
    name: "GXP:UPDATE:ENVIRONMENT",
    description: "Update environment details"
  },
  { name: "GXP:DELETE:ENVIRONMENT", description: "Delete an environment" },

  { name: "GXP:CREATE:SUPPLIERS", description: "Create a supplier" },
  { name: "GXP:VIEW:SUPPLIERS", description: "View suppliers" },
  {
    name: "GXP:UPDATE:SUPPLIERS",
    description: "Update supplier details"
  },
  { name: "GXP:DELETE:SUPPLIERS", description: "Delete a supplier" },

  {
    name: "GXP:CREATE:SOFTWARE_MODULES",
    description: "Create a software module"
  },
  {
    name: "GXP:VIEW:SOFTWARE_MODULES",
    description: "View software modules"
  },
  {
    name: "GXP:UPDATE:SOFTWARE_MODULES",
    description: "Update software module details"
  },
  {
    name: "GXP:DELETE:SOFTWARE_MODULES",
    description: "Delete a software module"
  },

  { name: "GXP:CREATE:SOFTWARE", description: "Create a software" },
  { name: "GXP:VIEW:SOFTWARE", description: "View software" },
  {
    name: "GXP:UPDATE:SOFTWARE",
    description: "Update software details"
  },
  { name: "GXP:DELETE:SOFTWARE", description: "Delete a software" },

  {
    name: "GXP:CREATE:SERVICE_REQUEST",
    description: "Create a service request"
  },
  {
    name: "GXP:VIEW:SERVICE_REQUEST",
    description: "View service requests"
  },
  {
    name: "GXP:UPDATE:SERVICE_REQUEST",
    description: "Update service request details"
  },
  {
    name: "GXP:DELETE:SERVICE_REQUEST",
    description: "Delete a service request"
  }
];

module.exports = {
  async up(db) {
    await db.collection("permissions").updateMany(
      { type: { $exists: false } },
      {
        $set: {
          type: "default"
        }
      }
    );

    // 1. Insert Permissions
    await db.collection("permissions").insertMany(
      permissions.map((permission) => ({
        ...permission,
        type: "gxp_service",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }))
    );

    console.log("Permissions inserted");
  },

  async down(db) {
    // Remove Permissions
    const permissionNames = permissions.map((permission) => permission.name);

    await db
      .collection("permissions")
      .deleteMany({ name: { $in: permissionNames } });
  }
};
