import { Router } from "express";
import {
  searchGroups,
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  disableGroup,
  restoreGroup,
  enableGroup,
  deleteGroup,
  bulkDeleteGroupsController,
  bulkDuplicateGroupsController,
  bulkCopyGroups,
  bulkUpdateGroups,
  bulkRestoreGroups
} from "../controllers/gxp-service-assignment-groups.controller";
import API_ROUTES from "../utils/routes";
import { validateDto, validateDtoArray } from "../middlewares/validate-dto.middleware";
import {
  CreateAssignmentGroupDto,
  UpdateAssignmentGroupDto
} from "../dtos/assignment-group.dto";
import { BulkCreateDto, BulkUpdateDto, BulkOperationDto } from "../dtos/common.dto";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.ASSIGNMENT_GROUPS.SEARCH, searchGroups);
router.get(API_ROUTES.ASSIGNMENT_GROUPS.ROOT, getAllGroups);
// BY_ID ("/:id") is one-segment, same shape as SEARCH ("/search") above — must
// register after it, or "/search" would be swallowed as id="search".
router.get(API_ROUTES.ASSIGNMENT_GROUPS.BY_ID, getGroupById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.ASSIGNMENT_GROUPS.ROOT,
  validateDto(CreateAssignmentGroupDto),
  createGroup
);
router.post("/restore", restoreGroup); // optional legacy route, or add `API_ROUTES.ASSIGNMENT_GROUPS.RESTORE` if you want consistent naming

router.post(
  API_ROUTES.ASSIGNMENT_GROUPS.BULK_DELETE,
  bulkDeleteGroupsController
);
router.post(
  API_ROUTES.ASSIGNMENT_GROUPS.BULK_DUPLICATE,
  bulkDuplicateGroupsController
);
router.post(
  API_ROUTES.ASSIGNMENT_GROUPS.BULK_COPY,
  validateDto(BulkCreateDto),
  validateDtoArray(CreateAssignmentGroupDto, "records"),
  bulkCopyGroups
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
router.patch(
  API_ROUTES.ASSIGNMENT_GROUPS.BULK_UPDATE,
  validateDto(BulkUpdateDto),
  validateDtoArray(UpdateAssignmentGroupDto, "updates", "payload"),
  bulkUpdateGroups
);
router.patch(
  API_ROUTES.ASSIGNMENT_GROUPS.BULK_RESTORE,
  validateDto(BulkOperationDto),
  bulkRestoreGroups
);

router.patch(
  API_ROUTES.ASSIGNMENT_GROUPS.BY_ID,
  validateDto(UpdateAssignmentGroupDto),
  updateGroup
);
router.patch(API_ROUTES.ASSIGNMENT_GROUPS.ENABLE_BY_ID, enableGroup);
router.patch(API_ROUTES.ASSIGNMENT_GROUPS.DISABLE_BY_ID, disableGroup);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.ASSIGNMENT_GROUPS.BY_ID, deleteGroup);

export default router;
