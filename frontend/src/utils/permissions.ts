export const PERMISSIONS = {
  VIEW_DASHBOARD: "VIEW:DASHBOARD"
};

export const hasPermission = (
  user: Record<string, string>,
  permission: string
) => {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
};
