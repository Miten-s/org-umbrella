import { Router } from "express";
import { getCompany, updateCompany } from "../controllers/company.controller";
import { upload } from "../middlewares/multer.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------
router.get(API_ROUTES.COMPANY, getCompany);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------
router.patch(
  API_ROUTES.COMPANY + API_ROUTES.PARAMS,
  upload.single("logo"),
  updateCompany
);

export default router;
