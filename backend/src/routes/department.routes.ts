import express from "express";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  bulkDeleteDepartments
} from "../controllers/department.controller";
import API_ROUTES from "../utils/routes";
import { validateDto } from "../middlewares/validate-dto.middleware";
import {
  CreateDepartmentDto,
  UpdateDepartmentDto
} from "../dtos/department.dto";
import { IsValidParamsIdDto } from "../dtos/common.dto";
import { checkPermissions } from "../middlewares/permission.middleware";

const router = express.Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.DEPARTMENTS, getAllDepartments);

router.get(
  API_ROUTES.DEPARTMENTS + API_ROUTES.PARAMS,
  checkPermissions(["VIEW:DEPARTMENT"]),
  validateDto(IsValidParamsIdDto, "params"),
  getDepartmentById
);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.DEPARTMENTS,
  checkPermissions(["CREATE:DEPARTMENT"]),
  validateDto(CreateDepartmentDto),
  createDepartment
);

router.post(
  API_ROUTES.DEPARTMENTS + API_ROUTES.BULK_DELETE,
  checkPermissions(["DELETE:DEPARTMENT"]),
  bulkDeleteDepartments
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch(
  API_ROUTES.DEPARTMENTS + API_ROUTES.PARAMS,
  checkPermissions(["UPDATE:DEPARTMENT"]),
  validateDto(IsValidParamsIdDto, "params"),
  validateDto(UpdateDepartmentDto),
  updateDepartment
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(
  API_ROUTES.DEPARTMENTS + API_ROUTES.PARAMS,
  checkPermissions(["DELETE:DEPARTMENT"]),
  validateDto(IsValidParamsIdDto, "params"),
  deleteDepartment
);

export default router;
