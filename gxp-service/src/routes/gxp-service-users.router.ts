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
import { validateDto, validateDtoArray } from "../middlewares/validate-dto.middleware";
import { CreateUserDTO } from "../dtos/user.dto";
import { BulkCreateDto, BulkUpdateDto, BulkOperationDto } from "../dtos/common.dto";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.USER.ROOT, getAllUsers);
router.get(API_ROUTES.USER.BY_ID, getUserById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(API_ROUTES.USER.ROOT, createUser);
router.post(API_ROUTES.USER.BULK_DELETE, bulkDeleteUsers);
router.post(
  API_ROUTES.USER.BULK_COPY,
  validateDto(BulkCreateDto),
  validateDtoArray(CreateUserDTO, "records"),
  bulkCopyUsers
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
// No UpdateUserDTO exists yet — same as the single-record PATCH below, which
// also runs unvalidated; only the batch-size cap applies here.
router.patch(API_ROUTES.USER.BULK_UPDATE, validateDto(BulkUpdateDto), bulkUpdateUsers);
router.patch(API_ROUTES.USER.BULK_RESTORE, validateDto(BulkOperationDto), bulkRestoreUsers);

router.patch(API_ROUTES.USER.BY_ID, updateUser);

router.patch(API_ROUTES.USER.DISABLE_BY_ID, disableUser);

router.patch(API_ROUTES.USER.ENABLE_BY_ID, enableUser);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------
router.delete(API_ROUTES.USER.BY_ID, deleteUser);

export default router;
