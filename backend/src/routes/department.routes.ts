import express from "express";
import {
  createDepartment,
  disableDepartment,
  enableDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment
} from "../controllers/department.controller";
import API_ROUTES from "../utils/routes";
const router = express.Router();

router.get(API_ROUTES.DEPARTMENTS, getAllDepartments);

router.get(API_ROUTES.DEPARTMENTS + API_ROUTES.PARAMS, getDepartmentById);

router.post(API_ROUTES.DEPARTMENTS, createDepartment);

router.patch(API_ROUTES.DEPARTMENTS + API_ROUTES.PARAMS, updateDepartment);

router.patch(
  API_ROUTES.DEPARTMENTS + API_ROUTES.PARAMS + API_ROUTES.DISABLE,
  disableDepartment
);

router.patch(
  API_ROUTES.DEPARTMENTS + API_ROUTES.PARAMS + API_ROUTES.ENABLE,
  enableDepartment
);

export default router;
