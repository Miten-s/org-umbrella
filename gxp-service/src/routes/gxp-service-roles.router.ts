import express from "express";
import {
  createRole,
  getAllRoles,
  updateRole,
  disableRole,
  enableRole
} from "../controllers/gxp-service-roles.controller";

const router = express.Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get("/", getAllRoles);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post("/", createRole);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch("/:id", updateRole);

router.patch("/:id/disable", disableRole);

router.patch("/:id/enable", enableRole);

export default router;
