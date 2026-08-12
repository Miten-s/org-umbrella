import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import API_ROUTES from "../utils/routes";
import permissionRoutes from "./permission.routes";
import groupRoutes from "./group.routes";
import roleRoutes from "./role.routes";
import limsUserRoutes from "./lims-user.routes";
import phraseRoutes from "./phrase.routes";
import locationRoutes from "./location.routes";

const commonRouter: Router = Router();

// All routes require authentication (spec NFR-1: single SSO/AD login for every
// app). Authentication only proves identity — each entity router additionally
// carries `authorize(entity, action)`, which is what actually grants access.
commonRouter.use(authenticate);

commonRouter.use(API_ROUTES.PERMISSIONS, permissionRoutes);

// ─── Administration ─────────────────────────────────────────────────────────
commonRouter.use(API_ROUTES.GROUPS, groupRoutes);
commonRouter.use(API_ROUTES.ROLES, roleRoutes);
commonRouter.use(API_ROUTES.LIMS_USERS, limsUserRoutes);

// ─── Master Data ────────────────────────────────────────────────────────────
commonRouter.use(API_ROUTES.PHRASES, phraseRoutes);
commonRouter.use(API_ROUTES.LOCATIONS, locationRoutes);

// Remaining entity routers are mounted here as each one is built.

export default commonRouter;
