import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
import API_ROUTES from "../utils/routes";
import {
  assignRole,
  createRole,
  deleteRole,
  updateRole,
} from "../controllers/user.controller";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

// Define a POST route for user login using the LOGIN route from API_ROUTES
router.post(API_ROUTES.LOGIN, login);

// Define a POST route for user registration using the REGISTER route from API_ROUTES
router.post(API_ROUTES.REGISTER, register);

// Define a POST route for creating a role
router.post(API_ROUTES.ROLE, createRole);

// Define a POST route for assigning a role to a user
router.post(API_ROUTES.USER + API_ROUTES.ASSIGN_ROLE, assignRole);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// Define a Patch route for updating a role
router.post(API_ROUTES.ROLE + API_ROUTES.PARAMS, updateRole);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

// Define a Delete route for updating a role
router.delete(API_ROUTES.ROLE + API_ROUTES.PARAMS, deleteRole);

export default router;
