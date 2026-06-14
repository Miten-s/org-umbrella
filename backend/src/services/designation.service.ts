import { Designation, IDesignation } from "../models/designation.model";
import { PaginationOptions, escapeRegex } from "../utils/pagination.util";
import mongoose from "mongoose";

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

const bulkDuplicateDesignations = async (ids: string[], user?: any) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const sourceDesignations = await Designation.find({
      _id: { $in: ids }
    }).session(session);
    if (!sourceDesignations || sourceDesignations.length === 0) {
      throw new Error("Designations not found");
    }

    const duplicatedDesignations = [];

    for (const sourceDesignation of sourceDesignations) {
      let baseName = sourceDesignation.designationName;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${escapedBaseName}(?:-\\((\\d+)\\))?$`);

      const similarDesignationsResult = await Designation.find({
        designationName: { $regex: regex }
      }).session(session);

      let maxIndex = 0;
      similarDesignationsResult.forEach((desig: any) => {
        const match = desig.designationName.match(regex);
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const toSave = new Designation({
        designationName: newName,
        description: sourceDesignation.description,
        status: sourceDesignation.status,
        deletedAt: null,
        modifiedOn: new Date(),
        modifiedBy: user?._id
      });

      const savedDesignation = await toSave.save({ session });
      duplicatedDesignations.push(savedDesignation);
    }

    await session.commitTransaction();
    return duplicatedDesignations;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export {
  createDesignation,
  getAllDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
  bulkDeleteDesignations,
  bulkDuplicateDesignations
};
