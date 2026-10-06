import { Request, Response } from "express";
import { Op } from "sequelize";
import asyncHandler from "../middlewares/error.middleware";
import { User } from "../models/user.model";
import { Role } from "../models/role.model";
import { Permission } from "../models/permission.model";
import { Location } from "../models/location.model";
import { Department } from "../models/department.model";

/** Batch lookups so other services can show names for ids they store, without reading
 * backend's database directly. Only active (not deleted) records are returned. */

const MAX_IDS = 500;

const listFrom = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((v): v is string => typeof v === "string"))]
    : [];

const tooMany = (res: Response, ...lists: string[][]) => {
  if (lists.every((list) => list.length <= MAX_IDS)) return false;
  res.status(400).json({ error: `At most ${MAX_IDS} values per request` });
  return true;
};

export const lookupUsers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const ids = listFrom(req.body?.ids);
    const emails = listFrom(req.body?.emails).map((e) =>
      e.trim().toLowerCase()
    );
    if (tooMany(res, ids, emails)) return;
    if (!ids.length && !emails.length) {
      res.status(200).json({ users: [] });
      return;
    }

    const users = await User.findAll({
      where: {
        [Op.or]: [
          ...(ids.length ? [{ id: ids }] : []),
          ...(emails.length ? [{ email: emails }] : [])
        ]
      },
      attributes: ["id", "name", "email"]
    });
    res.status(200).json({
      users: users.map((u) => ({ id: u.id, name: u.name, email: u.email }))
    });
  }
);

export const lookupLocations = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const ids = listFrom(req.body?.ids);
    if (tooMany(res, ids)) return;
    const locations = ids.length
      ? await Location.findAll({
          where: { id: ids },
          attributes: ["id", "locationName", "status"]
        })
      : [];
    res.status(200).json({
      locations: locations.map((l) => ({
        id: l.id,
        locationName: l.locationName,
        status: l.status
      }))
    });
  }
);

export const lookupDepartments = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const ids = listFrom(req.body?.ids);
    if (tooMany(res, ids)) return;
    const departments = ids.length
      ? await Department.findAll({
          where: { id: ids },
          attributes: ["id", "departmentName", "status"]
        })
      : [];
    res.status(200).json({
      departments: departments.map((d) => ({
        id: d.id,
        departmentName: d.departmentName,
        status: d.status
      }))
    });
  }
);

/** Roles with their permission ids, for display (the GXP Users list shows role names). */
export const lookupRoles = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const ids = listFrom(req.body?.ids);
    if (tooMany(res, ids)) return;
    const roles = ids.length
      ? await Role.findAll({
          where: { id: ids },
          attributes: ["id", "name", "type"],
          include: [
            {
              model: Permission,
              as: "permissions",
              attributes: ["id"],
              through: { attributes: [] }
            }
          ]
        })
      : [];
    res.status(200).json({
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        permissionIds: (r.permissions ?? []).map((p) => p.id)
      }))
    });
  }
);
