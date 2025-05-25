import { Router } from "express";
import API_ROUTES from "../utils/routes";
import {
  assignRole,
  createRole,
  deleteRole,
  getRoles,
  updateRole
} from "../controllers/role.controller";
import { validateDto } from "../middlewares/validate-dto.middleware";
import { IsValidParamsIdDto } from "../dtos/designation.dto";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

// Define a GET route for getting roles.
router.get(API_ROUTES.ROLE, getRoles);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

// Define a POST route for creating a role.
router.post(API_ROUTES.ROLE, createRole);

// Define a POST route for assigning a role to a user.
router.post(API_ROUTES.USER + API_ROUTES.ASSIGN_ROLE, assignRole);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// Define a Patch route for updating a role.
router.patch(
  API_ROUTES.ROLE + API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  updateRole
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

// Define a Delete route for updating a role.
router.delete(
  API_ROUTES.ROLE + API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  deleteRole
);

export default router;
