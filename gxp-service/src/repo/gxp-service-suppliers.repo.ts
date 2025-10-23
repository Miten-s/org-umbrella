import {
  GxpSupplierModel,
  IGxpSupplier
} from "../models/gxp-service-suppliers.model";

export const createSupplier = async (payload: Partial<IGxpSupplier>) => {
  const doc = new GxpSupplierModel(payload);
  return await doc.save();
};

export const findAllSuppliers = async (
  filter = {},
  projection = null,
  options = {}
) => {
  return await GxpSupplierModel.find(filter, projection, options).lean();
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
