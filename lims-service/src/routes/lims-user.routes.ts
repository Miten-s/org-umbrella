import { Router } from "express";
import LimsUser from "../models/lims-user.model";
import UserAccessGroup from "../models/user-access-group.model";
import UserRole from "../models/user-role.model";
import Group from "../models/group.model";
import Role from "../models/role.model";
import Location from "../models/location.model";
import {
  buildCrudRouter,
  buildCrudService,
  CrudConfig,
  CrudContext
} from "../utils/crud-factory";
import { CreateLimsUserDto, UpdateLimsUserDto } from "../dtos/master-data.dto";
import { invalidateAllUserContexts } from "../services/user-context.service";
import { preventRoleAssignmentEscalation } from "../middlewares/role-escalation.middleware";
import API_ROUTES from "../utils/routes";

/** Lab Users — LIMS never creates a person, this grants an existing platform user access.
 * `accessGroups`/`roles` arrive as id arrays, expanded into child rows for replace-set
 * semantics and a free audit diff, same nested-children machinery as any other sub-form. */
export const limsUserConfig: CrudConfig<LimsUser> = {
  model: LimsUser,
  entityName: "Lab User",
  permissionEntity: "USER",
  uniqueField: "userId",
  // `userId` is a specific platform user, not a name — a Copy collision must fail loudly,
  // never auto-suffix into an id that matches nobody. See CrudConfig's own doc comment.
  strictCopyCollision: true,
  searchFields: ["userId", "userName", "description"],
  defaultSortBy: "userName",
  relations: [
    { model: Group, as: "group", attributes: ["id", "name"], required: false },
    {
      model: Location,
      as: "location",
      attributes: [
        "id",
        "locationId",
        "locationName",
        ["location_name", "name"]
      ],
      required: false
    },
    {
      model: Group,
      as: "accessGroups",
      attributes: ["id", "name"],
      through: { attributes: [] },
      required: false
    },
    {
      model: Role,
      as: "roles",
      attributes: ["id", "roleId", "name"],
      through: { attributes: [] },
      required: false
    }
  ],
  relationFields: { group: "groupId", location: "locationId" },

  // `roles` stays in the list query — LimsUser.columns.tsx renders it.
  // `accessGroups` doesn't appear anywhere on the list, only Edit/View.
  listExcludeRelations: ["accessGroups"],

  normalizePayload: (payload) => {
    const next = { ...payload };

    // AsyncSelect yields `user: { id, name }` — split into the two columns; `userName`
    // is denormalised here since the platform user lives in a different database.
    if (next.user && typeof next.user === "object") {
      const { id, name } = next.user as { id?: string; name?: string };
      if (id) next.userId = id;
      if (name) next.userName = name;
      delete next.user;
    }

    // ["<uuid>", …] → [{ groupId: "<uuid>" }, …] so the child sync can diff them.
    if (Array.isArray(next.accessGroups)) {
      next.accessGroups = next.accessGroups.map((id: string) => ({
        groupId: id
      }));
    }
    if (Array.isArray(next.roles)) {
      next.roles = next.roles.map((id: string) => ({ roleId: id }));
    }
    return next;
  },

  // `user`/`userId` are both optional on the DTO, so neither being present must be caught
  // here — the column is NOT NULL and would otherwise surface as a raw database error.
  beforeCreate: (payload) => {
    if (!payload.userId) {
      throw Object.assign(
        new Error("Select the platform user this lab user grants access to."),
        { statusCode: 400 }
      );
    }
    return payload;
  },

  children: [
    {
      field: "accessGroups",
      model: UserAccessGroup,
      foreignKey: "limsUserId",
      fields: ["groupId"],
      matchKey: "groupId"
    },
    {
      field: "roles",
      model: UserRole,
      foreignKey: "limsUserId",
      fields: ["roleId"],
      matchKey: "roleId"
    }
  ],

  // Changing someone's groups or roles is exactly the case that must not wait
  // for a cache to expire.
  afterWrite: invalidateAllUserContexts
};

const base = buildCrudService(limsUserConfig);

const SELF_REMOVAL_MESSAGE =
  "You cannot remove your own Lab User record — it would lock you out of LIMS " +
  "with no way to undo it yourself. Ask another administrator to do it.";

const SELF_ACCESS_CHANGE_MESSAGE =
  "You cannot change your own role, groups, or home group. Ask another " +
  "administrator to do it.";

/** Removing your own Lab User record is a total, self-inflicted lockout — recovery needs
 * direct database access. Guards both single-row and bulk paths via `ctx.actor.id`. */
const assertNotSelf = async (ids: string[], ctx: CrudContext) => {
  const targets = await LimsUser.findAll({ where: { id: ids } as any });
  if (targets.some((target) => target.userId === ctx.actor.id)) {
    throw Object.assign(new Error(SELF_REMOVAL_MESSAGE), { statusCode: 400 });
  }
};

// Fields that change what a Lab User can do or see — self-service escalation surface.
const ACCESS_FIELDS = ["roles", "accessGroups", "group", "groupId"];

/** A service Admin (Super Admin exempt, per req. 10) must not be able to grant themself
 * broader access by editing their own Lab User's role/group assignment, even though they
 * hold UPDATE:USER — deletion already has this guard above, updates didn't. */
const assertNoSelfAccessChange = async (
  id: string,
  payload: Record<string, any>,
  ctx: CrudContext
) => {
  if (ctx.scope.operateAll) return;
  if (!ACCESS_FIELDS.some((field) => field in payload)) return;

  const target = await LimsUser.findByPk(id);
  if (target?.userId === ctx.actor.id) {
    throw Object.assign(new Error(SELF_ACCESS_CHANGE_MESSAGE), {
      statusCode: 403
    });
  }
};

const remove = async (
  id: string,
  changeReason: string | undefined,
  ctx: CrudContext
) => {
  await assertNotSelf([id], ctx);
  return base.remove(id, changeReason, ctx);
};

const bulkDelete = async (
  ids: string[],
  changeReason: string | undefined,
  ctx: CrudContext
) => {
  await assertNotSelf(ids, ctx);
  return base.bulkDelete(ids, changeReason, ctx);
};

const update = async (
  id: string,
  raw: Record<string, any>,
  ctx: CrudContext,
  files?: Express.Multer.File[]
) => {
  await assertNoSelfAccessChange(id, raw, ctx);
  return base.update(id, raw, ctx, files);
};

const bulkUpdate = async (
  updates: { id: string; payload: Record<string, any> }[],
  changeReason: string | undefined,
  ctx: CrudContext
) => {
  await Promise.all(
    updates.map(({ id, payload }) => assertNoSelfAccessChange(id, payload, ctx))
  );
  return base.bulkUpdate(updates, changeReason, ctx);
};

const service = { ...base, remove, bulkDelete, update, bulkUpdate };

const limsUserCrudRouter = buildCrudRouter({
  service,
  entityName: limsUserConfig.entityName,
  permissionEntity: limsUserConfig.permissionEntity,
  createDto: CreateLimsUserDto,
  updateDto: UpdateLimsUserDto
});

// Same independent-check pattern as role.routes.ts: an admin can't assign a Lab Role
// that grants more than their own permission set, checked before the CRUD router runs.
const router = Router();
router.post("/", preventRoleAssignmentEscalation);
// Registered before "/:id" — both are one-segment PATCH routes, same ordering concern
// buildCrudRouter itself documents for BULK_UPDATE vs PARAMS.
router.patch(API_ROUTES.BULK_UPDATE, preventRoleAssignmentEscalation);
router.patch("/:id", preventRoleAssignmentEscalation);
router.use(limsUserCrudRouter);

export default router;
