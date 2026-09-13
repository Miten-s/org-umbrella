import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorize.middleware";
import * as reviewService from "../services/periodic-review.service";

export const handleSchedulePeriodicReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { appId, projectId, scheduledDate } = req.body;
    if (!appId || !projectId) {
      res.status(400).json({ error: "appId and projectId are required." });
      return;
    }

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "Quality Officer"
    };

    const review = await reviewService.schedulePeriodicReview(
      { appId, projectId, scheduledDate },
      actor
    );

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

export const handleGetPeriodicReviews = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reviews = await reviewService.getPeriodicReviews();
    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

export const handleCompletePeriodicReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const actor = {
      id: req.user?.id || "00000000-0000-0000-0000-000000000000",
      fullName: req.user?.fullName || "Quality Officer"
    };

    const review = await reviewService.completePeriodicReview(id, actor);
    res.status(200).json(review);
  } catch (error) {
    next(error);
  }
};
