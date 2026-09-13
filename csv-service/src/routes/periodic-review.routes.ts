import { Router } from "express";
import {
  handleSchedulePeriodicReview,
  handleGetPeriodicReviews,
  handleCompletePeriodicReview
} from "../controllers/periodic-review.controller";

const router = Router();

// Step 8 Periodic Review Maintenance
router.post("/schedule", handleSchedulePeriodicReview);
router.get("/", handleGetPeriodicReviews);
router.post("/:id/complete", handleCompletePeriodicReview);

export default router;
