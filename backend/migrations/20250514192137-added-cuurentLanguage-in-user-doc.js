module.exports = {
  async up(db, client) {
    // Update all users who do not have the 'currentLanguage' field
    const result = await db.collection("users").updateMany(
      { currentLanguage: { $exists: false } },
      {
        $set: {
          currentLanguage: "en", // Set your default language here
          updatedAt: new Date()
        }
      }
    );

    console.log(`Added 'currentLanguage' to ${result.modifiedCount} user(s).`);
  },

  async down(db, client) {
    // Remove the 'currentLanguage' field from all users
    const result = await db.collection("users").updateMany(
      { currentLanguage: { $exists: true } },
      {
        $unset: { currentLanguage: "" },
        $set: { updatedAt: new Date() }
      }
    );

    console.log(
      `Removed 'currentLanguage' from ${result.modifiedCount} user(s).`
    );
  }
};
