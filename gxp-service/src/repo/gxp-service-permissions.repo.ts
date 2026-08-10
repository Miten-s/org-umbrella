import GxpServicePortalPermission, {
  IGxpServicePortalPermission
} from "../models/gxp-service-permissions.model";

const formatPermission = (perm: any) => {
  if (!perm) return null;
  const json = perm.toJSON ? perm.toJSON() : { ...perm };
  json._id = json.id;
  return json;
};

export const createPermission = async (
  payload: Partial<IGxpServicePortalPermission>
) => {
  const doc = await GxpServicePortalPermission.create(payload as any);
  return formatPermission(doc);
};

export const getPermissions = async (
  filter: any = {},
  projection = null,
  options = {}
) => {
  const where = { ...filter };
  if (where._id) {
    where.id = where._id;
    delete where._id;
  }
  const docs = await GxpServicePortalPermission.findAll({ where });
  return docs.map(formatPermission);
};

export const getPermissionById = async (id: string) => {
  const doc = await GxpServicePortalPermission.findByPk(id);
  return formatPermission(doc);
};

export const updatePermissionById = async (
  id: string,
  updates: Partial<IGxpServicePortalPermission>
) => {
  const doc = await GxpServicePortalPermission.findByPk(id);
  if (!doc) return null;
  await doc.update(updates);
  return formatPermission(doc);
};

export const deletePermission = async (id: string) => {
  const doc = await GxpServicePortalPermission.findByPk(id);
  if (!doc) return null;
  await doc.destroy();
  return formatPermission(doc);
};
