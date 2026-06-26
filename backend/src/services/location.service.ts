import { ILocation, Location } from "../models/location.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

const formatLocation = (loc: any) => {
  if (!loc) return null;
  const json = loc.toJSON ? loc.toJSON() : { ...loc };
  json._id = json.id;
  return json;
};

const createLocation = async (data: ILocation) => {
  const doc = await Location.create(data as any);
  return formatLocation(doc);
};

const getAllLocations = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const where: any = {};

  if (search) {
    const searchVal = `%${search}%`;
    where[Op.or] = [
      { locationName: { [Op.iLike]: searchVal } },
      { description: { [Op.iLike]: searchVal } }
    ];
  }

  const { count: totalCount, rows: data } = await Location.findAndCountAll({
    where,
    offset: skip,
    limit,
    order: [["created_at", "DESC"]]
  });

  return {
    locations: data.map(formatLocation),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

const getLocationById = async (_id: string) => {
  const doc = await Location.findByPk(_id);
  return formatLocation(doc);
};

const updateLocation = async (_id: string, data: Partial<ILocation>) => {
  const location = await Location.findByPk(_id);
  if (!location) return null;
  await location.update(data);
  return formatLocation(location);
};

const deleteLocation = async (_id: string) => {
  const location = await Location.findByPk(_id);
  if (!location) return null;
  await location.destroy();
  return formatLocation(location);
};

const bulkDeleteLocations = async (ids: string[]) => {
  return await Location.destroy({
    where: { id: ids }
  });
};

const bulkDuplicateLocations = async (ids: string[], user?: any) => {
  const t = await sequelize.transaction();
  try {
    const sourceLocations = await Location.findAll({
      where: { id: ids },
      transaction: t
    });
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
      const regexStr = `^${escapedBaseName}(?:-\\(([0-9]+)\\))?$`;

      const similarLocationsResult = await Location.findAll({
        where: {
          locationName: { [Op.iRegexp]: regexStr }
        },
        transaction: t
      });

      let maxIndex = 0;
      similarLocationsResult.forEach((loc: any) => {
        const match = loc.locationName.match(new RegExp(regexStr, 'i'));
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const savedLocation = await Location.create({
        locationName: newName,
        description: sourceLocation.description,
        comments: sourceLocation.comments,
        status: sourceLocation.status,
        deletedAt: null,
        modifiedOn: new Date(),
        modifiedBy: user?.id || user?._id
      } as any, { transaction: t });

      duplicatedLocations.push(savedLocation);
    }

    await t.commit();
    return duplicatedLocations.map(formatLocation);
  } catch (error) {
    await t.rollback();
    throw error;
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
