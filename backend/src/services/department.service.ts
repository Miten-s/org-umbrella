import { Department, IDepartment } from "../models/department.model";
import { User } from "../models/user.model";
import { Location } from "../models/location.model";
import { PaginationOptions } from "../utils/pagination.util";
import { Op } from "sequelize";
import { sequelize } from "../configs/db.sequelize";

const formatDepartment = (dept: any) => {
  if (!dept) return null;
  const json = dept.toJSON ? dept.toJSON() : { ...dept };
  json._id = json.id;
  if (json.manager) {
    json.departmentManager = {
      _id: json.manager.id,
      id: json.manager.id,
      name: json.manager.name
    };
  } else {
    json.departmentManager = null;
  }
  if (json.location) {
    json.departmentGroupLocation = {
      _id: json.location.id,
      id: json.location.id,
      locationName: json.location.locationName
    };
  } else {
    json.departmentGroupLocation = null;
  }
  return json;
};

const createDepartment = async (data: IDepartment, user: any) => {
  const departmentManagerId = (data as any).departmentManagerId || (data as any).departmentManager;
  const departmentGroupLocationId = (data as any).departmentGroupLocationId || (data as any).departmentGroupLocation;
  
  const creator = typeof user === "string" ? user : user?.name || user?.id || user?._id;

  const newDept = await Department.create({
    ...data,
    departmentManagerId,
    departmentGroupLocationId,
    createdBy: creator,
    modifiedBy: creator,
    modifiedOn: new Date()
  } as any);

  // Re-fetch with associations
  const fetched = await Department.findByPk(newDept.id, {
    include: [
      { model: User, as: "manager", attributes: ["id", "name"] },
      { model: Location, as: "location", attributes: ["id", "locationName"] }
    ]
  });

  return formatDepartment(fetched);
};

const getAllDepartments = async (options: PaginationOptions) => {
  const { page, limit, skip, search } = options;
  const where: any = {};

  if (search) {
    const searchVal = `%${search}%`;
    where[Op.or] = [
      { departmentName: { [Op.iLike]: searchVal } },
      { description: { [Op.iLike]: searchVal } }
    ];
  }

  const { count: totalCount, rows: data } = await Department.findAndCountAll({
    where,
    offset: skip,
    limit,
    include: [
      { model: User, as: "manager", attributes: ["id", "name"] },
      { model: Location, as: "location", attributes: ["id", "locationName"] }
    ],
    order: [["created_at", "DESC"]]
  });

  return {
    departments: data.map(formatDepartment),
    metadata: {
      totalCount,
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

const getDepartmentById = async (id: string) => {
  const dept = await Department.findByPk(id, {
    include: [
      { model: User, as: "manager", attributes: ["id", "name"] },
      { model: Location, as: "location", attributes: ["id", "locationName"] }
    ]
  });
  return formatDepartment(dept);
};

const updateDepartment = async (
  _id: string,
  data: Partial<IDepartment>,
  user: any
) => {
  const dept = await Department.findByPk(_id);
  if (!dept) return null;

  const departmentManagerId = (data as any).departmentManagerId || (data as any).departmentManager;
  const departmentGroupLocationId = (data as any).departmentGroupLocationId || (data as any).departmentGroupLocation;
  const modifier = typeof user === "string" ? user : user?.name || user?.id || user?._id;

  await dept.update({
    ...data,
    departmentManagerId,
    departmentGroupLocationId,
    modifiedBy: modifier,
    modifiedOn: new Date()
  } as any);

  const fetched = await Department.findByPk(_id, {
    include: [
      { model: User, as: "manager", attributes: ["id", "name"] },
      { model: Location, as: "location", attributes: ["id", "locationName"] }
    ]
  });

  return formatDepartment(fetched);
};

const deleteDepartment = async (id: string) => {
  const dept = await Department.findByPk(id);
  if (!dept) return null;
  await dept.destroy();
  return formatDepartment(dept);
};

const bulkDeleteDepartments = async (ids: string[]) => {
  return await Department.destroy({
    where: { id: ids }
  });
};

const bulkDuplicateDepartments = async (ids: string[], user?: any) => {
  const t = await sequelize.transaction();
  try {
    const sourceDepartments = await Department.findAll({
      where: { id: ids },
      transaction: t
    });
    if (!sourceDepartments || sourceDepartments.length === 0) {
      throw new Error("Departments not found");
    }

    const duplicatedDepartments = [];

    for (const sourceDepartment of sourceDepartments) {
      let baseName = sourceDepartment.departmentName;
      const nameMatch = baseName.match(/^(.*)-\((\d+)\)$/);
      if (nameMatch) {
        baseName = nameMatch[1];
      }

      const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regexStr = `^${escapedBaseName}(?:-\\(([0-9]+)\\))?$`;

      const similarDepartmentsResult = await Department.findAll({
        where: {
          departmentName: { [Op.iRegexp]: regexStr }
        },
        transaction: t
      });

      let maxIndex = 0;
      similarDepartmentsResult.forEach((dept: any) => {
        const match = dept.departmentName.match(new RegExp(regexStr, 'i'));
        if (match && match[1]) {
          const index = parseInt(match[1], 10);
          if (index > maxIndex) maxIndex = index;
        }
      });

      const newName = `${baseName}-(${maxIndex + 1})`;

      const savedDepartment = await Department.create({
        departmentName: newName,
        departmentManagerId: sourceDepartment.departmentManagerId,
        departmentGroupLocationId: sourceDepartment.departmentGroupLocationId,
        description: sourceDepartment.description,
        status: sourceDepartment.status,
        deletedAt: null,
        createdBy: user?.id || user?._id || 'system',
        modifiedBy: user?.id || user?._id || 'system',
        modifiedOn: new Date()
      } as any, { transaction: t });

      duplicatedDepartments.push(savedDepartment);
    }

    await t.commit();
    
    // Fetch associations for the duplicated departments
    const dupIds = duplicatedDepartments.map(d => d.id);
    const populated = await Department.findAll({
      where: { id: dupIds },
      include: [
        { model: User, as: "manager", attributes: ["id", "name"] },
        { model: Location, as: "location", attributes: ["id", "locationName"] }
      ]
    });

    return populated.map(formatDepartment);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  bulkDeleteDepartments,
  bulkDuplicateDepartments
};
