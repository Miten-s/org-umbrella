import { Router } from "express";
import authRoutes from "../routes/auth.routes";
import roleRoutes from "../routes/role.routes";
import permissionRoutes from "../routes/permission.routes";
import locationRoutes from "../routes/location.routes";
import departmentRoutes from "../routes/department.routes";
import designationRouter from "../routes/designation.routes";

const commonRouter: Router = Router();

commonRouter.use(authRoutes);
commonRouter.use(roleRoutes);
commonRouter.use(permissionRoutes);
commonRouter.use(locationRoutes);
commonRouter.use(departmentRoutes);
commonRouter.use(designationRouter);

export default commonRouter;
