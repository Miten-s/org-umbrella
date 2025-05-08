import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
import API_ROUTES from "../utils/routes";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../controllers/user.controller";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

// Define a GET route for getting users.
router.get(API_ROUTES.USER, getUsers);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

// Define a POST route for user login using the LOGIN route from API_ROUTES.
router.post(API_ROUTES.LOGIN, login);

// Define a POST route for user registration using the REGISTER route from API_ROUTES.
router.post(API_ROUTES.REGISTER, register);

// Define a POST route for add users.
router.post(API_ROUTES.USER, createUser);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// Define a PATCH route for add users.
router.patch(API_ROUTES.USER + API_ROUTES.PARAMS, updateUser);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

// Define a DELETE route for add users.
router.delete(API_ROUTES.USER + API_ROUTES.PARAMS, deleteUser);

export default router;
