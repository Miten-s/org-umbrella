import Group from "./group.model";
import Role from "./role.model";
import RoleEntry from "./role-entry.model";
import LimsUser from "./lims-user.model";
import UserAccessGroup from "./user-access-group.model";
import UserRole from "./user-role.model";
import Phrase from "./phrase.model";
import PhraseEntry from "./phrase-entry.model";
import Location from "./location.model";

/**
 * All model associations in one place, registered once at boot.
 *
 * They live here rather than inside each model file because associations are
 * inherently circular (Role needs Group, Group is referenced by User, …) and
 * declaring them at import time makes module load order significant. One
 * explicit call from connectDB() removes that class of bug entirely.
 *
 * The `as` aliases are the names the frontend sees in nested relations, so
 * they must match the `<Entity>.types.ts` field names — `group`, `parent`,
 * `entries`, `accessGroups`, `roles`.
 */
let registered = false;

export const registerAssociations = () => {
  if (registered) return;
  registered = true;

  // Group hierarchy — access to a parent cascades to its children.
  // Aliased `parentGroup` to match the client's payload field name.
  Group.belongsTo(Group, { as: "parentGroup", foreignKey: "parentGroupId" });
  Group.hasMany(Group, { as: "childGroups", foreignKey: "parentGroupId" });

  // Role → owning group (an ownership tag, not an access scope).
  Role.belongsTo(Group, { as: "group", foreignKey: "groupId" });

  // Role → its permission grants, returned nested as `entries[]`.
  Role.hasMany(RoleEntry, { as: "entries", foreignKey: "roleId", onDelete: "CASCADE" });
  RoleEntry.belongsTo(Role, { as: "role", foreignKey: "roleId" });

  // LimsUser → home group.
  LimsUser.belongsTo(Group, { as: "group", foreignKey: "groupId" });

  // LimsUser → the groups they may reach.
  LimsUser.belongsToMany(Group, {
    as: "accessGroups",
    through: UserAccessGroup,
    foreignKey: "limsUserId",
    otherKey: "groupId"
  });
  Group.belongsToMany(LimsUser, {
    as: "users",
    through: UserAccessGroup,
    foreignKey: "groupId",
    otherKey: "limsUserId"
  });

  // LimsUser → roles (permissions are the UNION across all of them).
  LimsUser.belongsToMany(Role, {
    as: "roles",
    through: UserRole,
    foreignKey: "limsUserId",
    otherKey: "roleId"
  });
  Role.belongsToMany(LimsUser, {
    as: "users",
    through: UserRole,
    foreignKey: "roleId",
    otherKey: "limsUserId"
  });

  // LimsUser → home location.
  LimsUser.belongsTo(Location, { as: "location", foreignKey: "locationId" });

  // ─── Master data ─────────────────────────────────────────────────────────

  // Pick list → its values, returned nested as `entries[]`.
  Phrase.hasMany(PhraseEntry, { as: "entries", foreignKey: "phraseId", onDelete: "CASCADE" });
  PhraseEntry.belongsTo(Phrase, { as: "phrase", foreignKey: "phraseId" });
  Phrase.belongsTo(Group, { as: "group", foreignKey: "groupId" });

  // Storage tree: Building → Room → Freezer → Shelf.
  Location.belongsTo(Location, { as: "parentLocation", foreignKey: "parentLocationId" });
  Location.hasMany(Location, { as: "subLocations", foreignKey: "parentLocationId" });
  Location.belongsTo(Group, { as: "group", foreignKey: "groupId" });
  // The location's type is one value from the LOCATION_TYPE pick list.
  Location.belongsTo(PhraseEntry, { as: "locationType", foreignKey: "locationTypeId" });
};

export default registerAssociations;
