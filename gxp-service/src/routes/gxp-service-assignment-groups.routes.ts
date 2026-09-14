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
import {
  validateDto,
  validateDtoArray
} from "../middlewares/validate-dto.middleware";
import {
  CreateAssignmentGroupDto,
  UpdateAssignmentGroupDto
} from "../dtos/assignment-group.dto";
import {
  BulkCreateDto,
  BulkUpdateDto,
  BulkOperationDto
} from "../dtos/common.dto";
import { authorize } from "../middlewares/authorize.middleware";

const router = Router();
const can = (action: "VIEW" | "CREATE" | "UPDATE" | "DELETE") =>
  authorize("ASSIGNMENT_GROUP", action);

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.ASSIGNMENT_GROUPS.SEARCH, can("VIEW"), searchGroups);
router.get(API_ROUTES.ASSIGNMENT_GROUPS.ROOT, can("VIEW"), getAllGroups);
// BY_ID ("/:id") is one-segment, same shape as SEARCH ("/search") above — must
// register after it, or "/search" would be swallowed as id="search".
router.get(API_ROUTES.ASSIGNMENT_GROUPS.BY_ID, can("VIEW"), getGroupById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post(
  API_ROUTES.ASSIGNMENT_GROUPS.ROOT,
  can("CREATE"),
  validateDto(CreateAssignmentGroupDto),
  createGroup
);
router.post("/restore", can("UPDATE"), restoreGroup); // optional legacy route, or add `API_ROUTES.ASSIGNMENT_GROUPS.RESTORE` if you want consistent naming

router.post(
  API_ROUTES.ASSIGNMENT_GROUPS.BULK_DELETE,
  can("DELETE"),
  bulkDeleteGroupsController
);
router.post(
  API_ROUTES.ASSIGNMENT_GROUPS.BULK_DUPLICATE,
  can("CREATE"),
  bulkDuplicateGroupsController
);
router.post(
  API_ROUTES.ASSIGNMENT_GROUPS.BULK_COPY,
  can("CREATE"),
  validateDto(BulkCreateDto),
  validateDtoArray(CreateAssignmentGroupDto, "records"),
  bulkCopyGroups
);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

// bulk-update/bulk-restore MUST register before BY_ID ("/:id") — same one-segment
// path shape, and Express matches whichever is registered first.
router.patch(
  API_ROUTES.ASSIGNMENT_GROUPS.BULK_UPDATE,
  can("UPDATE"),
  validateDto(BulkUpdateDto),
  validateDtoArray(UpdateAssignmentGroupDto, "updates", "payload"),
  bulkUpdateGroups
);
router.patch(
  API_ROUTES.ASSIGNMENT_GROUPS.BULK_RESTORE,
  can("UPDATE"),
  validateDto(BulkOperationDto),
  bulkRestoreGroups
);

router.patch(
  API_ROUTES.ASSIGNMENT_GROUPS.BY_ID,
  can("UPDATE"),
  validateDto(UpdateAssignmentGroupDto),
  updateGroup
);
router.patch(
  API_ROUTES.ASSIGNMENT_GROUPS.ENABLE_BY_ID,
  can("UPDATE"),
  enableGroup
);
router.patch(
  API_ROUTES.ASSIGNMENT_GROUPS.DISABLE_BY_ID,
  can("UPDATE"),
  disableGroup
);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete(API_ROUTES.ASSIGNMENT_GROUPS.BY_ID, can("DELETE"), deleteGroup);

export default router;
