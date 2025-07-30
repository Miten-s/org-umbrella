module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const permission =[
      {
        name: "VIEW:COMPANY INFO",
        module: "COMPANY_INFO",
        description: "View the company info"
      }
    ]

    await db.collection("permissions").insertMany(permission);

  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const permission =[
      "VIEW:COMPANY INFO"
    ]
    await db.collection("permissions").deleteMany({ name: { $in: permission } });
  }
};
