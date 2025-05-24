import { Router } from "express";
import API_ROUTES from "../utils/routes";
import {
  createPermissions,
  deletePermissions,
  getPermissions,
  updatePermissions
} from "../controllers/permission.controller";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

// Define a GET route for getting roles.
router.get(API_ROUTES.PERMISSION, getPermissions);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

// Define a POST route for creating a role.
router.post(API_ROUTES.PERMISSION, createPermissions);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// Define a Patch route for updating a role.
router.patch(API_ROUTES.PERMISSION + API_ROUTES.PARAMS, updatePermissions);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

// Define a Delete route for updating a role.
router.delete(API_ROUTES.PERMISSION + API_ROUTES.PARAMS, deletePermissions);

export default router;
