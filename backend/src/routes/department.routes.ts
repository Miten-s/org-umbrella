import express from "express";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  bulkDeleteDepartments,
  bulkDuplicateDepartments,
  bulkCopyDepartments,
  bulkUpdateDepartments
} from "../controllers/department.controller";
import API_ROUTES from "../utils/routes";
import {
  validateDto,
  validateDtoArray
} from "../middlewares/validate-dto.middleware";
import {
  CreateDepartmentDto,
  UpdateDepartmentDto
} from "../dtos/department.dto";
import {
  BulkCreateDto,
  BulkUpdateDto,
  IsValidParamsIdDto
} from "../dtos/common.dto";
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

router.post(
  API_ROUTES.DEPARTMENTS + API_ROUTES.BULK_DUPLICATE,
  checkPermissions(["CREATE:DEPARTMENT"]),
  bulkDuplicateDepartments
);

router.post(
  API_ROUTES.DEPARTMENTS + API_ROUTES.BULK_COPY,
  checkPermissions(["CREATE:DEPARTMENT"]),
  validateDto(BulkCreateDto),
  validateDtoArray(CreateDepartmentDto, "records"),
  bulkCopyDepartments
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// Registered BEFORE the single-record PARAMS patch below: both are one-segment PATCH
// routes ("/bulk-update" vs "/:id"), so PARAMS going first would match "/bulk-update" as id="bulk-update".
router.patch(
  API_ROUTES.DEPARTMENTS + API_ROUTES.BULK_UPDATE,
  checkPermissions(["UPDATE:DEPARTMENT"]),
  validateDto(BulkUpdateDto),
  validateDtoArray(UpdateDepartmentDto, "updates", "payload"),
  bulkUpdateDepartments
);

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
