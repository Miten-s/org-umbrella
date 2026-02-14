import express from "express";
import {
  searchGroups,
  getAllGroups,
  createGroup,
  updateGroup,
  disableGroup,
  restoreGroup
} from "../controllers/gxp-service-assignment-groups.controller";

const router = express.Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get("/search", searchGroups);

router.get("/", getAllGroups);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post("/", createGroup);

router.post("/restore", restoreGroup);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch("/:groupName", updateGroup);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete("/:groupName", disableGroup);

export default router;
