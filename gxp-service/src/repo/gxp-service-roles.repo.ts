import GxpServicePortalRole from "../models/gxp-service-roles.model";

export const createRoleRepo = async (data: any) => {
  const role = new GxpServicePortalRole(data);
  return await role.save();
};

export const findAllRolesRepo = async () => {
  return await GxpServicePortalRole.find().populate("permissions", "name");
};

export const findRoleByIdRepo = async (id: string) => {
  return await GxpServicePortalRole.findById(id).populate(
    "permissions",
    "name"
  );
};

export const updateRoleRepo = async (id: string, data: any) => {
  return await GxpServicePortalRole.findByIdAndUpdate(id, data, {
    new: true
  }).populate("permissions", "name");
};

export const disableRoleRepo = async (id: string) => {
  return await updateRoleRepo(id, { status: "disabled" });
};

export const enableRoleRepo = async (id: string, comments: any) => {
  return await updateRoleRepo(id, { status: "enabled", modifiedBy: comments });
};
