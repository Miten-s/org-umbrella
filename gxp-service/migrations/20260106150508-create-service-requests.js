module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */

  async up(db) {
    const requestTypes = [
      "Provide Access",
      "Modify Access",
      "Remove Access",
      "Generate Report",
      "Add Master Data Request",
      "Edit Master Data Request",
      "Remove Master Data Request",
      "Other Request"
    ];

    await db.collection("gxp-service-app-services").bulkWrite(
      requestTypes.map((service) => ({
        updateOne: {
          filter: { service },
          update: {
            $setOnInsert: {
              service,
              active: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              __v: 0
            }
          },
          upsert: true
        }
      }))
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db) {
    await db.collection("gxp-service-app-services").deleteMany({});
  }
};
