import GxpServicePortalPermissions, {
  IGxpServicePortalPermissions
} from "../models/gxp-service-permissions.model";

export const createPermission = async (
  payload: Partial<IGxpServicePortalPermissions>
) => {
  const doc = new GxpServicePortalPermissions(payload);
  return await doc.save();
};

export const getPermissions = async (
  filter = {},
  projection = null,
  options = {}
) => {
  return await GxpServicePortalPermissions.find(
    filter,
    projection,
    options
  ).lean();
};

export const getPermissionById = async (id: string) => {
  return await GxpServicePortalPermissions.findById(id);
};

export const updatePermissionById = async (
  id: string,
  updates: Partial<IGxpServicePortalPermissions>
) => {
  return await GxpServicePortalPermissions.findByIdAndUpdate(id, updates, {
    new: true
  });
};

export const deletePermission = async (id: string) => {
  return await GxpServicePortalPermissions.findByIdAndUpdate(
    id,
    { status: "disabled" },
    { new: true }
  );
};
