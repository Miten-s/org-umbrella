// src/routes/gxpSupplier.routes.ts
import { Router } from "express";
import {
  create,
  list,
  getById,
  update,
  remove,
  restore,
  search
} from "../controllers/gxp-service-suppliers.controller";

const router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get("/", list);
router.get("/search", search);
router.get("/:id", getById);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post("/", create);
router.post("/:id/restore", restore);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------

router.patch("/:id", update);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

router.delete("/:id", remove);

export default router;
