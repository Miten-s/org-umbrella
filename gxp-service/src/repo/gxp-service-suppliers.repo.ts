import Supplier, { ISupplier } from "../models/gxp-service-suppliers.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";

const formatSupplier = (sup: any) => {
  if (!sup) return null;
  const json = sup.toJSON ? sup.toJSON() : { ...sup };
  json._id = json.id;
  return json;
};

export const createSupplier = async (payload: Partial<ISupplier>) => {
  const doc = await Supplier.create(payload as any);
  return formatSupplier(doc);
};

export const findAllSuppliers = async (
  filter: any = {},
  options: PaginationOptions
) => {
  const { page = 1, limit = 10, skip = 0, search } = options;
  const where: any = { ...filter };
  
  if (where._id) {
    where.id = where._id;
    delete where._id;
  }

  if (search) {
    const sanitizedSearch = `%${search}%`;
    where[Op.or] = [
      { supplierName: { [Op.iLike]: sanitizedSearch } },
      { description: { [Op.iLike]: sanitizedSearch } }
    ];
  }

  const { count: totalCount, rows: data } = await Supplier.findAndCountAll({
    where,
    offset: skip,
    limit,
    order: [["created_at", "DESC"]]
  });

  return {
    data: data.map(formatSupplier),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

export const findSupplierById = async (id: string) => {
  const doc = await Supplier.findByPk(id);
  return formatSupplier(doc);
};

export const updateSupplierById = async (
  id: string,
  updates: Partial<ISupplier>
) => {
  const doc = await Supplier.findByPk(id);
  if (!doc) return null;
  await doc.update(updates);
  return formatSupplier(doc);
};

export const softDisableSupplier = async (id: string) => {
  const doc = await Supplier.findByPk(id);
  if (!doc) return null;
  await doc.update({ status: "disabled" });
  return formatSupplier(doc);
};

export const restoreSupplier = async (id: string) => {
  const doc = await Supplier.findByPk(id);
  if (!doc) return null;
  await doc.update({ status: "enabled" });
  return formatSupplier(doc);
};

export const searchSuppliersByName = async (q: string, limit = 20) => {
  const searchVal = `%${q}%`;
  const data = await Supplier.findAll({
    where: {
      supplierName: { [Op.iLike]: searchVal },
      status: "enabled"
    },
    attributes: ["id", "supplierName"],
    limit
  });
  return data.map(formatSupplier);
};

export const deleteSupplierById = async (id: string) => {
  const doc = await Supplier.findByPk(id);
  if (!doc) return null;
  await doc.destroy();
  return formatSupplier(doc);
};

export const findSuppliersByIds = async (ids: string[]) => {
  const data = await Supplier.findAll({
    where: { id: ids }
  });
  return data.map(formatSupplier);
};

export const findSuppliersByFilter = async (filter: any) => {
  const where = { ...filter };
  if (where._id) {
    where.id = where._id;
    delete where._id;
  }
  const data = await Supplier.findAll({ where });
  return data.map(formatSupplier);
};

export const bulkDeleteSuppliers = async (ids: string[], session?: any) => {
  return await Supplier.destroy({
    where: { id: ids }
  });
};
