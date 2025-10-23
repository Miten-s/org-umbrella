import { Router } from "express";
import API_ROUTES from "../utils/routes";
import {
  createUser,
  disableUser,
  enableUser,
  getAllUsers,
  updateUser
} from "../controllers/gxp-service-users.controller";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.USER.ROOT, getAllUsers);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(API_ROUTES.USER.ROOT, createUser);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------
router.patch(API_ROUTES.USER.BY_ID, updateUser);

router.patch(API_ROUTES.USER.DISABLE_BY_ID, disableUser);

router.patch(API_ROUTES.USER.ENABLE_BY_ID, enableUser);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

export default router;
