import { Router } from "express";
import API_ROUTES from "../utils/routes";
import {
  bulkDeleteUsers,
  createUser,
  deleteUser,
  disableUser,
  enableUser,
  getAllUsers,
  getUserById,
  updateUser,
  bulkCopyUsers,
  bulkUpdateUsers,
  bulkRestoreUsers
} from "../controllers/gxp-service-users.controller";
import {
  validateDto,
  validateDtoArray
} from "../middlewares/validate-dto.middleware";
import { CreateUserDTO } from "../dtos/user.dto";
import {
  BulkCreateDto,
  BulkUpdateDto,
  BulkOperationDto
} from "../dtos/common.dto";
import { authorize } from "../middlewares/authorize.middleware";
import {
  preventSelfModification,
  preventRoleEscalation
} from "../middlewares/access-guards.middleware";

const router: Router = Router();
const can = (action: "VIEW" | "CREATE" | "UPDATE" | "DELETE") =>
  authorize("USER", action);

const selfFromParamId = preventSelfModification((req) => [
  req.params.id as string
]);
const selfFromBodyIds = preventSelfModification((req) =>
  Array.isArray(req.body?.ids) ? req.body.ids : []
);
const selfFromBulkUpdates = preventSelfModification((req) =>
  Array.isArray(req.body?.updates)
    ? req.body.updates.map((u: { id: string }) => u.id)
    : []
);

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.USER.ROOT, can("VIEW"), getAllUsers);
router.get(API_ROUTES.USER.BY_ID, can("VIEW"), getUserById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.USER.ROOT,
  can("CREATE"),
  preventRoleEscalation,
  createUser
);
router.post(
  API_ROUTES.USER.BULK_DELETE,
  can("DELETE"),
  selfFromBodyIds,
  bulkDeleteUsers
);
router.post(
  API_ROUTES.USER.BULK_COPY,
  can("CREATE"),
  validateDto(BulkCreateDto),
  validateDtoArray(CreateUserDTO, "records"),
  preventRoleEscalation,
  bulkCopyUsers
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
// No UpdateUserDTO exists yet — same as the single-record PATCH below, which
// also runs unvalidated; only the batch-size cap applies here.
router.patch(
  API_ROUTES.USER.BULK_UPDATE,
  can("UPDATE"),
  validateDto(BulkUpdateDto),
  selfFromBulkUpdates,
  preventRoleEscalation,
  bulkUpdateUsers
);
router.patch(
  API_ROUTES.USER.BULK_RESTORE,
  can("UPDATE"),
  validateDto(BulkOperationDto),
  selfFromBodyIds,
  bulkRestoreUsers
);

router.patch(
  API_ROUTES.USER.BY_ID,
  can("UPDATE"),
  selfFromParamId,
  preventRoleEscalation,
  updateUser
);

router.patch(
  API_ROUTES.USER.DISABLE_BY_ID,
  can("UPDATE"),
  selfFromParamId,
  disableUser
);

router.patch(
  API_ROUTES.USER.ENABLE_BY_ID,
  can("UPDATE"),
  selfFromParamId,
  enableUser
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------
router.delete(
  API_ROUTES.USER.BY_ID,
  can("DELETE"),
  selfFromParamId,
  deleteUser
);

export default router;
