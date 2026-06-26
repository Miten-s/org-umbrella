import { Designation, IDesignation } from "../models/designation.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

const formatDesignation = (desig: any) => {
  if (!desig) return null;
  const json = desig.toJSON ? desig.toJSON() : { ...desig };
  json._id = json.id;
  return json;
};

const createDesignation = async (data: IDesignation) => {
  const doc = await Designation.create(data as any);
  return formatDesignation(doc);
};

const getAllDesignations = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const where: any = {};

  if (search) {
    const searchVal = `%${search}%`;
    where[Op.or] = [
      { designationName: { [Op.iLike]: searchVal } },
      { description: { [Op.iLike]: searchVal } }
    ];
  }

  const { count: totalCount, rows: data } = await Designation.findAndCountAll({
    where,
    offset: skip,
    limit,
    order: [["created_at", "DESC"]]
  });

  return {
    designations: data.map(formatDesignation),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

const getDesignationById = async (_id: string) => {
  const doc = await Designation.findByPk(_id);
  return formatDesignation(doc);
};

const updateDesignation = async (_id: string, data: Partial<IDesignation>) => {
  const designation = await Designation.findByPk(_id);
  if (!designation) return null;
  await designation.update(data);
  return formatDesignation(designation);
};

const deleteDesignation = async (_id: string) => {
  const designation = await Designation.findByPk(_id);
  if (!designation) return null;
  await designation.destroy();
  return formatDesignation(designation);
};

const bulkDeleteDesignations = async (ids: string[]) => {
  return await Designation.destroy({
    where: { id: ids }
  });
};

const bulkDuplicateDesignations = async (ids: string[], user?: any) => {
  const t = await sequelize.transaction();
  try {
    const sourceDesignations = await Designation.findAll({
      where: { id: ids },
      transaction: t
    });
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
      const regexStr = `^${escapedBaseName}(?:-\\(([0-9]+)\\))?$`;

      const similarDesignationsResult = await Designation.findAll({
        where: {
          designationName: { [Op.iRegexp]: regexStr }
        },
        transaction: t
      });

      let maxIndex = 0;
      similarDesignationsResult.forEach((desig: any) => {
        const match = desig.designationName.match(new RegExp(regexStr, 'i'));
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const savedDesignation = await Designation.create({
        designationName: newName,
        description: sourceDesignation.description,
        status: sourceDesignation.status,
        deletedAt: null,
        modifiedOn: new Date(),
        modifiedBy: user?.id || user?._id
      } as any, { transaction: t });

      duplicatedDesignations.push(savedDesignation);
    }

    await t.commit();
    return duplicatedDesignations.map(formatDesignation);
  } catch (error) {
    await t.rollback();
    throw error;
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
