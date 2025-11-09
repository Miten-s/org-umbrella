import { Router } from "express";
import gxpUserRouter from "./gxp-service-users.router";
import gxpSupplierRouter from "./gxp-service-suppliers.routes";
import gxpEnvironmentRouter from "./gxp-service-environments.routes";
import gxpApplicationRouter from "./gxp-service-applications.routes";
import gxpWorkflowRouter from "./gxp-service-workflows.router";
import gxpServiceRequestsRouter from "./gxp-service-service-requests.routes";
import gxpAssignmentGroupsRouter from "./gxp-service-assignment-groups.routes";
import API_ROUTES from "../utils/routes";
import { authenticate } from "../middlewares/auth.middleware";

const commonRouter: Router = Router();

commonRouter.use(API_ROUTES.GXP_USERS, gxpUserRouter);

commonRouter.use(API_ROUTES.GXP_SUPPLIERS, authenticate, gxpSupplierRouter);

commonRouter.use(
  API_ROUTES.GXP_ENVIRONMENTS,
  authenticate,
  gxpEnvironmentRouter
);

commonRouter.use(
  API_ROUTES.GXP_APPLICATIONS,
  authenticate,
  gxpApplicationRouter
);

commonRouter.use(
  API_ROUTES.GXP_SERVICES_REQUESTS,
  authenticate,
  gxpServiceRequestsRouter
);

commonRouter.use(
  API_ROUTES.GXP_ASSIGNMENT_GROUPS,
  authenticate, gxpAssignmentGroupsRouter
);
commonRouter.use(API_ROUTES.GXP_WORKFLOWS, authenticate, gxpWorkflowRouter);

export default commonRouter;
