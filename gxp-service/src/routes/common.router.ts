import { Router } from "express";
import gxpRouter from "./gxp-service-users.router";
import API_ROUTES from "../utils/routes";

const commonRouter: Router = Router();

commonRouter.use(API_ROUTES.GXP_SERVICE, gxpRouter);

export default commonRouter;
