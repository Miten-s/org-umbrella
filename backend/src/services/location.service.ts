import { ILocation, Location } from "../models/location.model";

const createLocation = async (data: ILocation) => {
  const newLocation = new Location(data);
  return await newLocation.save();
};

const getAllLocations = async () => {
  return await Location.find().exec();
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
