import { PaginationOptions, escapeRegex } from "../utils/pagination.util";
import {
  GxpSupplierModel,
  IGxpSupplier
} from "../models/gxp-service-suppliers.model";

export const createSupplier = async (payload: Partial<IGxpSupplier>) => {
  const doc = new GxpSupplierModel(payload);
  return await doc.save();
};


export const findAllSuppliers = async (
  filter: any = {},
  options: PaginationOptions
) => {
  const { page = 1, limit = 10, skip = 0, search } = options;
  if (search) {
    const sanitizedSearch = escapeRegex(search);
    if (!filter.$or) filter.$or = [];
    filter.$or.push(
      { supplierName: { $regex: sanitizedSearch, $options: "i" } },
      { description: { $regex: sanitizedSearch, $options: "i" } }
    );
  }
  const [data, totalCount] = await Promise.all([
    GxpSupplierModel.find(filter).skip(skip).limit(limit).lean(),
    GxpSupplierModel.countDocuments(filter).exec()
  ]);
  return {
    data,
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const findSupplierById = async (id: string) => {
  return await GxpSupplierModel.findById(id);
};

export const updateSupplierById = async (
  id: string,
  updates: Partial<IGxpSupplier>
) => {
  return await GxpSupplierModel.findByIdAndUpdate(id, updates, { new: true });
};

export const softDisableSupplier = async (id: string) => {
  return await GxpSupplierModel.findByIdAndUpdate(
    id,
    { status: "disabled" },
    { new: true }
  );
};

export const restoreSupplier = async (id: string) => {
  return await GxpSupplierModel.findByIdAndUpdate(
    id,
    { status: "enabled" },
    { new: true }
  );
};

export const searchSuppliersByName = async (q: string, limit = 20) => {
  const regex = new RegExp(q.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
  return await GxpSupplierModel.find({ supplierName: regex, status: "enabled" })
    .select("_id supplierName")
    .limit(limit)
    .lean();
};

export const deleteSupplierById = async (id: string) => {
  return await GxpSupplierModel.findByIdAndDelete(id);
};
