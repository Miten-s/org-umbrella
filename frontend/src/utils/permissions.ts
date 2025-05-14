export const PERMISSIONS = {
  VIEW_DASHBOARD: "VIEW:DASHBOARD"
};
export const hasPermission = (user: any, permission: string) => {
  const permissions = user.roles
    ?.flatMap((role: any) => role.permissions)
    .map((permission: any) => permission.name);
    
  return (
    permissions?.includes(permission) || permissions?.includes("OPERATE:ALL")
  );
};
