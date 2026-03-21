import { Request } from "express";
import { IUser, User } from "../models/user.model";
import { Role, RoleType } from "../models/role.model";

// 15th aprile 2026
// If userType is Admin, it ensures the Admin built-in role is attached. If userType is User, it now does the same for the User built-in role. Any roles already passed in the payload are preserved and deduplicated.
const assignDefaultRole = async (payload: Record<string, any>) => {
  if (!payload.userType) return payload;

  const defaultRole = await Role.findOne({
    name: payload.userType,
    type: RoleType.BUILT_IN
  })
    .select("_id")
    .lean();

  if (!defaultRole) return payload;

  const existingRoles = Array.isArray(payload.roles) ? payload.roles : [];
  const roleIds = new Set([
    defaultRole._id.toString(),
    ...existingRoles.map((roleId: any) => roleId.toString())
  ]);

  payload.roles = Array.from(roleIds);
  return payload;
};

const getUsers = async (user?: IUser) => {
  let filter = { fullName: { $nin: ["superadmin", user?.fullName] } };
  let populatation = {
    populate: [
      {
        path: "roles",
        select: ["name", "type", "permissions"]
      },
      {
        path: "department",
        select: ["departmentName"]
      },
      {
        path: "location",
        select: ["locationName"]
      },
      {
        path: "designation",
        select: ["designationName"]
      }
    ]
  };
  return await User.find(filter, null, populatation).exec();
};

const createUser = async (req: Request) => {
  const payload =
    typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;
  const signature = req.file?.filename;
  payload["createdBy"] = req?.user?._id;

  if (signature) {
    payload["signature"] = signature;
  }
  await assignDefaultRole(payload);
  return await User.create(payload);
};

const updateUser = async (req: Request) => {
  const payload =
    typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;
  const signature = req.file?.filename;
  if (signature) {
    payload["signature"] = signature;
  }
  return await User.updateOne({ _id: req.params.id }, { $set: payload });
};

const deleteUser = async (req: Request) => {
  return await User.updateOne(
    { _id: req.params.id },
    { $set: { deletedAt: new Date() } }
  );
};

const getUserDetail = async (id: string) => {
  return await User.findOne(
    { _id: id },
    { password: 0 },
    {
      populate: [
        {
          path: "roles",
          select: ["name", "type", "permissions"]
        },
        {
          path: "department",
          select: ["departmentName"]
        },
        {
          path: "location",
          select: ["locationName"]
        },
        {
          path: "designation",
          select: ["designationName"]
        }
      ]
    }
  ).exec();
};

export default { getUsers, createUser, updateUser, deleteUser, getUserDetail };
