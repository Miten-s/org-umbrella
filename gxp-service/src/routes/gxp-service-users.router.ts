import { Router } from "express";
import API_ROUTES from "../utils/routes";
import {
  bulkDeleteUsers,
  createUser,
  deleteUser,
  disableUser,
  enableUser,
  getAllUsers,
  updateUser,
  bulkCopyUsers,
  bulkUpdateUsers,
  bulkRestoreUsers
} from "../controllers/gxp-service-users.controller";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.USER.ROOT, getAllUsers);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(API_ROUTES.USER.ROOT, createUser);
router.post(API_ROUTES.USER.BULK_DELETE, bulkDeleteUsers);
router.post(API_ROUTES.USER.BULK_COPY, bulkCopyUsers);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
router.patch(API_ROUTES.USER.BULK_UPDATE, bulkUpdateUsers);
router.patch(API_ROUTES.USER.BULK_RESTORE, bulkRestoreUsers);

router.patch(API_ROUTES.USER.BY_ID, updateUser);

router.patch(API_ROUTES.USER.DISABLE_BY_ID, disableUser);

router.patch(API_ROUTES.USER.ENABLE_BY_ID, enableUser);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------
router.delete(API_ROUTES.USER.BY_ID, deleteUser);

export default router;
