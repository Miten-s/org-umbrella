import { QueryInterface, DataTypes } from "sequelize";

/** Points each Lab Role at its copy in backend's roles table, written by backend's
 * migrate-lims-roles.ts. Lab Role definitions are moving to backend (the model GXP already
 * uses); assignments stay in lims_user_roles. Nullable and unused by enforcement until the
 * cutover: until then only the dual-read comparison and the parity check read it.
 *
 * No FK — backend's roles live in a different database. */
export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.addColumn("lims_roles", "backend_role_id", {
    type: DataTypes.UUID,
    allowNull: true
  });

  await queryInterface.addIndex("lims_roles", ["backend_role_id"], {
    name: "lims_roles_backend_role_id_idx"
  });
};
