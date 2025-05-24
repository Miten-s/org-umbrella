import { Router } from "express";
import * as designationController from "../controllers/designation.controller";
import API_ROUTES from "../utils/routes";

const router = Router();

router.get(API_ROUTES.DESIGNATION, designationController.getAllDesignations);

router.get(
  API_ROUTES.DESIGNATION + API_ROUTES.PARAMS,
  designationController.getDesignationByName
);

router.post(API_ROUTES.DESIGNATION, designationController.createDesignation);

router.patch(API_ROUTES.PARAMS, designationController.updateDesignation);

router.patch(
  API_ROUTES.DESIGNATION + API_ROUTES.PARAMS + API_ROUTES.DISABLE,
  designationController.disableDesignation
);
router.patch(
  API_ROUTES.DESIGNATION + API_ROUTES.PARAMS + API_ROUTES.ENABLE,
  designationController.enableDesignation
);

export default router;
