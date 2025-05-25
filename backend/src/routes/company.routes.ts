import { Router } from "express";
import {
  getAllCompanies,
  updateCompany
} from "../controllers/company.controller";
import { upload } from "../middlewares/multer.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------
router.get(API_ROUTES.COMPANY, getAllCompanies);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------
router.patch(API_ROUTES.COMPANY, upload.single("logo"), updateCompany);

export default router;
