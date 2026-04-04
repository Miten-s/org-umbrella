import { ILocation, Location } from "../models/location.model";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";

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
export {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation
};
