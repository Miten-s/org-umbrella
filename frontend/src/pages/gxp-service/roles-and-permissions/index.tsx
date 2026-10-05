import RoleList from "./RoleList";

/** Roles & Permissions — a single Roles list, matching LIMS's Lab Roles page structure.
 * A separate "Permissions" tab used to sit here (GXP's permission catalog lives in the
 * platform's own table, unlike LIMS's, which are embedded per-role) but was removed for
 * consistency between the two services' role screens. */
const RolesAndPermissions = () => {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 lg:h-[calc(100dvh-132px)]">
      <div className="min-h-0 flex-1">
        <RoleList />
      </div>
    </div>
  );
};

export default RolesAndPermissions;
