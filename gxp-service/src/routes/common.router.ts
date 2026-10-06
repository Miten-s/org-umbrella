import { Router } from "express";
import gxpUserRouter from "./gxp-service-users.router";
import gxpRolesRouter from "./gxp-service-roles.routes";
import gxpSupplierRouter from "./gxp-service-suppliers.routes";
import gxpEnvironmentRouter from "./gxp-service-environments.routes";
import gxpApplicationRouter from "./gxp-service-applications.routes";
import gxpWorkflowRouter from "./gxp-service-workflows.router";
import gxpApplicationModuleRouter from "./gxp-service-application-modules.routes";
import gxpServiceRequestsRouter from "./gxp-service-service-requests.routes";
import gxpAssignmentGroupsRouter from "./gxp-service-assignment-groups.routes";
import gxpMeRouter from "./gxp-service-me.routes";
import API_ROUTES from "../utils/routes";
import { authenticate } from "../middlewares/auth.middleware";

const commonRouter: Router = Router();

commonRouter.use("/gxp-me", authenticate, gxpMeRouter);

commonRouter.use(API_ROUTES.GXP_USERS, authenticate, gxpUserRouter);

commonRouter.use(API_ROUTES.GXP_ROLES, authenticate, gxpRolesRouter);

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
  authenticate,
  gxpAssignmentGroupsRouter
);
commonRouter.use(API_ROUTES.GXP_WORKFLOWS, authenticate, gxpWorkflowRouter);

commonRouter.use(
  API_ROUTES.GXP_APPLICATION_MODULES,
  authenticate,
  gxpApplicationModuleRouter
);

export default commonRouter;
