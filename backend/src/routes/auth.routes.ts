import { Router } from "express";
import { login, logout } from "../controllers/auth.controller";
import API_ROUTES from "../utils/routes";
import {
  createUser,
  deleteUser,
  getUserDetail,
  getUsers,
  updateUser
} from "../controllers/user.controller";
import { checkPermissions } from "../middlewares/permission.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { CreateUserDTO } from "../dtos/user.dto";
import { upload } from "../middlewares/multer.middleware";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

// Define a GET route for getting user detail.
router.get(API_ROUTES.AUTH + API_ROUTES.ME, authenticate, getUserDetail);

// Define a GET route for getting users.
router.get(
  API_ROUTES.AUTH + API_ROUTES.USER,
  authenticate,
  checkPermissions(["VIEW:USER"]),
  getUsers
);

// Define a GET route for user logout.
router.post(API_ROUTES.AUTH + API_ROUTES.LOGOUT, logout);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

// Define a POST route for user login using the LOGIN route from API_ROUTES.
router.post(API_ROUTES.AUTH + API_ROUTES.LOGIN, login);

// Define a POST route for add users.
router.post(
  API_ROUTES.AUTH + API_ROUTES.USER,
  authenticate,
  validateDto(CreateUserDTO),
  checkPermissions(["CREATE:USER"]),
  upload.single("signature"),
  createUser
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// Define a PATCH route for add users.
router.patch(
  API_ROUTES.AUTH + API_ROUTES.USER + API_ROUTES.PARAMS,
  authenticate,
  checkPermissions(["UPDATE:USER"]),
  upload.single("signature"),
  updateUser
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

// Define a DELETE route for add users.
router.delete(
  API_ROUTES.AUTH + API_ROUTES.USER + API_ROUTES.PARAMS,
  authenticate,
  checkPermissions(["DELETE:USER"]),
  deleteUser
);

export default router;
