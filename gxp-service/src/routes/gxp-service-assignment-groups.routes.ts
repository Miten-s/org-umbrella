import { Router } from "express";
import {
  searchGroups,
  getAllGroups,
  createGroup,
  updateGroup,
  disableGroup,
  restoreGroup,
  enableGroup
} from "../controllers/gxp-service-assignment-groups.controller";
import API_ROUTES from "../utils/routes";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.ASSIGNMENT_GROUPS.SEARCH, searchGroups);
router.get(API_ROUTES.ASSIGNMENT_GROUPS.ROOT, getAllGroups);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(API_ROUTES.ASSIGNMENT_GROUPS.ROOT, createGroup);
router.post("/restore", restoreGroup); // optional legacy route, or add `API_ROUTES.ASSIGNMENT_GROUPS.RESTORE` if you want consistent naming

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch(API_ROUTES.ASSIGNMENT_GROUPS.BY_ID, updateGroup);
router.patch(API_ROUTES.ASSIGNMENT_GROUPS.ENABLE_BY_ID, enableGroup);
router.patch(API_ROUTES.ASSIGNMENT_GROUPS.DISABLE_BY_ID, disableGroup);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------


export default router;
