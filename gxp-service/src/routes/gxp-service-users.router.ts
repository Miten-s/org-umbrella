import { Router } from "express";
import API_ROUTES from "../utils/routes";
import {
  createUser,
  disableUser,
  enableUser,
  getAllUsers,
  updateUser
} from "../controllers/gxp-service-users.controller";

const router: Router = Router();

// ---------------------------------------------------------------------------------------- GET Requests ----------------------------------------------------------------------------------------

router.get(API_ROUTES.ROOT, (req, res) => {
  res.send("GXP Service Users API");
});

router.get("/", getAllUsers);

// ---------------------------------------------------------------------------------------- POST Requests ----------------------------------------------------------------------------------------

router.post("/", createUser);

// ---------------------------------------------------------------------------------------- PATCH Requests ----------------------------------------------------------------------------------------
router.patch("/:id", updateUser);

router.patch("/:id/disable", disableUser);

router.patch("/:id/enable", enableUser);

// ---------------------------------------------------------------------------------------- DELETE Requests ----------------------------------------------------------------------------------------

export default router;
