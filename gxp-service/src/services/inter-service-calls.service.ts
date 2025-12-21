import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.AUTH_MONGO_URI || "";

export const createAuthClient = async () => {
  try {
    const client = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      tls: true
    });

    await client.connect();
    const db = client.db("umbrella");
    return { db, client };
  } catch (error) {
    throw new Error("Failed to connect to Auth database: " + error);
  }
};

export const fetchUserBasedOnId = async (userIds: string[]) => {
  const { db, client } = await createAuthClient();
  try {
    const usersCollection = db.collection("users");
    const objectIds = userIds.map((id) => new ObjectId(id));
    const users = await usersCollection
      .find({ _id: { $in: objectIds } })
      .project({ _id: 1, name: 1, email: 1 })
      .toArray();

    return users;
  } catch (error) {
    throw new Error("Failed to fetch users: " + error);
  } finally {
    await client.close();
  }
};
