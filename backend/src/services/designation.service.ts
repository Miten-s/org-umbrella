import { Designation, IDesignation } from "../models/designation.model";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";

const createDesignation = async (data: IDesignation) => {
  const newDesignation = new Designation(data);
  return await newDesignation.save();
};

const getAllDesignations = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const filter: any = {};

  if (search) {
    const sanitizedSearch = escapeRegex(search);
    filter.$or = [
      { designationName: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } }
    ];
  }

  const [data, totalCount] = await Promise.all([
    Designation.find(filter).skip(skip).limit(limit).exec(),
    Designation.countDocuments(filter).exec()
  ]);

  return {
    designations: data,
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

const getDesignationById = async (_id: string) => {
  return await Designation.findOne({ _id }).exec();
};

const updateDesignation = async (_id: string, data: Partial<IDesignation>) => {
  return await Designation.findOneAndUpdate({ _id }, data, {
    new: true
  }).exec();
};

const deleteDesignation = async (_id: string) => {
  return await Designation.findOneAndUpdate(
    { _id },
    { $set: { deletedAt: new Date() } },
    { new: true }
  ).exec();
};

const bulkDeleteDesignations = async (ids: string[]) => {
  return await Designation.updateMany(
    { _id: { $in: ids }, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );
};

export {
  createDesignation,
  getAllDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
  bulkDeleteDesignations
};
