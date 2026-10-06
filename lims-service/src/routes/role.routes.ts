import { Router } from "express";
import { buildCrudRouter, CrudService } from "../utils/crud-factory";
import { CreateRoleDto, UpdateRoleDto } from "../dtos/master-data.dto";
import { preventRoleEscalation } from "../middlewares/role-escalation.middleware";
import { labRoleService } from "../services/lab-role.service";

/** Lab Roles — stored in backend, see lab-role.service.ts. Same endpoints and payloads as
 * every other LIMS entity; the form may send `permissions[]` codes or the `entries[]` grid. */
const roleCrudRouter = buildCrudRouter({
  service: labRoleService as unknown as CrudService<any>,
  entityName: "Lab Role",
  permissionEntity: "ROLE",
  createDto: CreateRoleDto,
  updateDto: UpdateRoleDto
});

// Nobody can grant permissions they don't hold themselves, whichever endpoint they use.
const router = Router();
router.post("/", preventRoleEscalation);
router.post("/bulk-copy", preventRoleEscalation);
router.patch("/bulk-update", preventRoleEscalation);
router.patch("/:id", preventRoleEscalation);
router.use(roleCrudRouter);

export default router;
