import { Router } from "express";
import {
  createCompany,
  getAllCompanies
} from "../controllers/company.controller";
import { upload } from "../middlewares/multer.middleware";
import API_ROUTES from "../utils/routes";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------
router.get(API_ROUTES.COMPANY, getAllCompanies);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------
router.post(API_ROUTES.COMPANY, upload.single("logo"), createCompany);

export default router;
