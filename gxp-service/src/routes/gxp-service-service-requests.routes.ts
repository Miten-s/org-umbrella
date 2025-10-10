// src/routes/serviceRequest.routes.ts

import { Router } from "express";
import multer from "multer";
import {
  create,
  getAll,
  getById
} from "../controllers/gxp-service-service-requests.controller.js";

const router = Router();

const upload = multer({ dest: "uploads/" });

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------
router.get("/", getAll);

router.get("/:id", getById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------
router.post("/", upload.array("trainingEvidence"), create);

export default router;
