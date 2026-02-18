import { Db, MongoClient, ObjectId } from "mongodb";

const uri = process.env.AUTH_MONGO_URI || "";

export let db: Db | null = null;

(async () => {
  if (db) return;
  try {
    const client = new MongoClient(uri, {
      minPoolSize: 0,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000
    });

    await client.connect();
    db = client.db("umbrella");
  } catch (error) {
    throw new Error("Failed to connect to Auth database: " + error);
  }
})();

export const fetchUserBasedOnId = async (userIds: string[]) => {
  if (!db) {
    throw new Error("Database connection is not established");
  }

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
  }
};

export const fetchLocationsFromAuthService = async (ids: string[]) => {
  if (!db) {
    throw new Error("Database connection is not established");
  }

  try {
    const groupsCollection = db.collection("locations");
    const objectIds = ids.map((id) => new ObjectId(id));
    const groups = await groupsCollection
      .find({ _id: { $in: objectIds } })
      .project({ _id: 1, locationName: 1, status: 1 })
      .toArray();

    return groups;
  } catch (error) {
    throw new Error("Failed to fetch groups: " + error);
  }
};

export const fetchDepartmentsFromAuthService = async (ids: string[]) => {
  if (!db) {
    throw new Error("Database connection is not established");
  }

  try {
    const groupsCollection = db.collection("departments");
    const objectIds = ids.map((id) => new ObjectId(id));
    const groups = await groupsCollection
      .find({ _id: { $in: objectIds } })
      .project({ _id: 1, departmentName: 1, status: 1 })
      .toArray();

    return groups;
  } catch (error) {
    throw new Error("Failed to fetch groups: " + error);
  }
};

export const fetchRolesFromAuthService = async (
  ids: string[],
  project?: any
) => {
  if (!db) {
    throw new Error("Database connection is not established");
  }

  try {
    const groupsCollection = db.collection("roles");
    const objectIds = ids.map((id) => new ObjectId(id));
    const roles = await groupsCollection
      .find({ _id: { $in: objectIds } }, { projection: project ?? [] })
      .toArray();

    return roles;
  } catch (error) {
    throw new Error("Failed to fetch roles: " + error);
  }
};
