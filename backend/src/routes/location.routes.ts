import { Router } from "express";
import {
  createLocation,
  disableLocation,
  enableLocation,
  getAllLocations,
  getLocationByName,
  updateLocation
} from "../controllers/location.controller";
import API_ROUTES from "../utils/routes";

const router = Router();

router.get(API_ROUTES.LOCATIONS, getAllLocations);

router.get(API_ROUTES.LOCATIONS + API_ROUTES.PARAMS, getLocationByName);

router.post(API_ROUTES.LOCATIONS, createLocation);

router.patch(API_ROUTES.LOCATIONS + API_ROUTES.PARAMS, updateLocation);

router.patch(
  API_ROUTES.LOCATIONS + API_ROUTES.PARAMS + API_ROUTES.DISABLE,
  disableLocation
);

router.patch(
  API_ROUTES.LOCATIONS + API_ROUTES.PARAMS + API_ROUTES.ENABLE,
  enableLocation
);

export default router;
