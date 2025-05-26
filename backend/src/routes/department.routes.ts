import express from "express";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment
} from "../controllers/department.controller";
import API_ROUTES from "../utils/routes";
import { validateDto } from "../middlewares/validate-dto.middleware";
import {
  CreateDepartmentDto,
  UpdateDepartmentDto
} from "../dtos/department.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.DEPARTMENTS, getAllDepartments);

router.get(
  API_ROUTES.DEPARTMENTS + API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  getDepartmentById
);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.DEPARTMENTS,
  authenticate,
  validateDto(CreateDepartmentDto),
  createDepartment
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch(
  API_ROUTES.DEPARTMENTS + API_ROUTES.PARAMS,
  authenticate,
  validateDto(IsValidParamsIdDto, "params"),
  validateDto(UpdateDepartmentDto),
  updateDepartment
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(
  API_ROUTES.DEPARTMENTS + API_ROUTES.PARAMS,
  validateDto(IsValidParamsIdDto, "params"),
  deleteDepartment
);

export default router;
