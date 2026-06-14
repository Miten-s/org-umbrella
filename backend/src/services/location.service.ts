import { ILocation, Location } from "../models/location.model";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";
import mongoose from "mongoose";

const createLocation = async (data: ILocation) => {
  const newLocation = new Location(data);
  return await newLocation.save();
};

const getAllLocations = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const filter: any = {};

  if (search) {
    const sanitizedSearch = escapeRegex(search);
    filter.$or = [
      { locationName: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } }
    ];
  }

  const [data, totalCount] = await Promise.all([
    Location.find(filter).skip(skip).limit(limit).exec(),
    Location.countDocuments(filter).exec()
  ]);

  return {
    locations: data,
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

const getLocationById = async (_id: string) => {
  return await Location.findOne({ _id }).exec();
};

const updateLocation = async (_id: string, data: Partial<ILocation>) => {
  return await Location.findOneAndUpdate({ _id }, data, {
    new: true
  }).exec();
};

const deleteLocation = async (_id: string) => {
  return await Location.findOneAndUpdate(
    { _id },
    { deletedAt: new Date() }
  ).exec();
};

const bulkDeleteLocations = async (ids: string[]) => {
  return await Location.updateMany(
    { _id: { $in: ids }, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );
};

const bulkDuplicateLocations = async (ids: string[], user?: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const sourceLocations = await Location.find({ _id: { $in: ids } }).session(
      session
    );
    if (!sourceLocations || sourceLocations.length === 0) {
      throw new Error("Locations not found");
    }

    const duplicatedLocations = [];

    for (const sourceLocation of sourceLocations) {
      let baseName = sourceLocation.locationName;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${escapedBaseName}(?:-\\((\\d+)\\))?$`);

      const similarLocationsResult = await Location.find({
        locationName: { $regex: regex }
      }).session(session);

      let maxIndex = 0;
      similarLocationsResult.forEach((loc: any) => {
        const match = loc.locationName.match(regex);
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const toSave = new Location({
        locationName: newName,
        description: sourceLocation.description,
        comments: sourceLocation.comments,
        status: sourceLocation.status,
        deletedAt: null,
        modifiedOn: new Date(),
        modifiedBy: user?._id
      });

      const savedLocation = await toSave.save({ session });
      duplicatedLocations.push(savedLocation);
    }

    await session.commitTransaction();
    return duplicatedLocations;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
  bulkDeleteLocations,
  bulkDuplicateLocations
};
