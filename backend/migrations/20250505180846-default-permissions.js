const { ObjectId } = require('mongoose').Types;

module.exports = {
  async up(db, client) {
    // Assuming organizationId is provided as a constant or fetched from somewhere
    const organizationId = new ObjectId('68190121bbd4203f51d97751'); // Todo : Replace with the actual organization ID

    // Define default permissions for CRUD actions on User and Permission (Uppercase with colon)
    const permissions = [
      { name: 'CREATE:USER', description: 'Create a new user', organizationId },
      { name: 'READ:USER', description: 'Read user data', organizationId },
      { name: 'UPDATE:USER', description: 'Update user information', organizationId },
      { name: 'DELETE:USER', description: 'Delete a user', organizationId },
      { name: 'CREATE:PERMISSION', description: 'Create a new permission', organizationId },
      { name: 'READ:PERMISSION', description: 'Read permission data', organizationId },
      { name: 'UPDATE:PERMISSION', description: 'Update permission details', organizationId },
      { name: 'DELETE:PERMISSION', description: 'Delete a permission', organizationId },
    ];

    // Insert default permissions into the 'permissions' collection
    await db.collection('permissions').insertMany(permissions);

    console.log('Default permissions have been added with organizationId');
  },

  async down(db, client) {
    // Optionally, you can define a rollback process to remove these permissions
    const permissionNames = [
      'CREATE:USER', 'READ:USER', 'UPDATE:USER', 'DELETE:USER',
      'CREATE:PERMISSION', 'READ:PERMISSION', 'UPDATE:PERMISSION', 'DELETE:PERMISSION'
    ];

    await db.collection('permissions').deleteMany({ name: { $in: permissionNames } });

    console.log('Default permissions have been removed');
  }
};
