import { ILocation, Location } from "../models/location.model";

const createLocation = async (data: ILocation) => {
  const newLocation = new Location(data);
  return await newLocation.save();
};

const getAllLocations = async () => {
  return await Location.find().exec();
};

const getLocationByName = async (name: string) => {
  return await Location.findOne({ location_group_name: name }).exec();
};

const updateLocation = async (name: string, data: Partial<ILocation>) => {
  return await Location.findOneAndUpdate({ location_group_name: name }, data, {
    new: true
  }).exec();
};

const disableLocation = async ({
  name,
  comments
}: {
  name: string;
  comments: string;
}) => {
  return await Location.findOneAndUpdate(
    { locationName: name },
    { status: "disabled", comments },
    { new: true }
  ).exec();
};

const enableLocation = async (name: string) => {
  return await Location.findOneAndUpdate(
    { locationName: name },
    { status: "active" },
    { new: true }
  ).exec();
};

export {
  createLocation,
  getAllLocations,
  getLocationByName,
  updateLocation,
  disableLocation,
  enableLocation
};
