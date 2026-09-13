import CsvPeriodicReview from "../models/csv-periodic-review.model";
import CsvProject from "../models/csv-project.model";
import { writeAudit, AuditActor } from "../utils/audit.util";

export const schedulePeriodicReview = async (
  data: {
    appId: string;
    projectId: string;
    scheduledDate?: Date | string;
  },
  actor: AuditActor
): Promise<CsvPeriodicReview> => {
  const project = await CsvProject.findByPk(data.projectId);
  if (!project) {
    throw { statusCode: 404, message: `Project ${data.projectId} not found.` };
  }

  // Calculate 1-Year Periodic Review date if not explicitly provided
  let reviewDate = data.scheduledDate;
  if (!reviewDate) {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    reviewDate = nextYear.toISOString().split("T")[0];
  }

  const periodicReview = await CsvPeriodicReview.create({
    appId: data.appId,
    projectId: data.projectId,
    scheduledDate: reviewDate,
    status: "SCHEDULED"
  });

  await writeAudit({
    entityName: "csv_periodic_reviews",
    entityId: periodicReview.id,
    action: "CREATE",
    newValue: periodicReview.toJSON(),
    actor
  });

  return periodicReview;
};

export const getPeriodicReviews = async (): Promise<CsvPeriodicReview[]> => {
  return CsvPeriodicReview.findAll({
    include: [{ model: CsvProject, as: "project" }],
    order: [["scheduled_date", "ASC"]]
  });
};

export const completePeriodicReview = async (
  id: string,
  actor: AuditActor
): Promise<CsvPeriodicReview> => {
  const review = await CsvPeriodicReview.findByPk(id);
  if (!review) {
    throw { statusCode: 404, message: `Periodic Review ${id} not found.` };
  }

  const oldValue = review.toJSON();
  await review.update({
    status: "COMPLETED",
    reviewerId: actor.id
  });
  const newValue = review.toJSON();

  await writeAudit({
    entityName: "csv_periodic_reviews",
    entityId: review.id,
    action: "UPDATE",
    oldValue,
    newValue,
    actor
  });

  return review;
};

export const initPeriodicReviewCron = (): void => {
  console.log(
    "[csv-service] Initialized 1-Year Periodic Review Background Scheduler."
  );
  // Run daily check for upcoming periodic reviews
  setInterval(
    async () => {
      try {
        const scheduledReviews = await CsvPeriodicReview.findAll({
          where: { status: "SCHEDULED" }
        });
        const today = new Date();

        for (const review of scheduledReviews) {
          const reviewDate = new Date(review.scheduledDate);
          const diffDays = Math.ceil(
            (reviewDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
          );

          if (diffDays <= 30 && diffDays > 0) {
            console.log(
              `[csv-service Cron] Notice: Periodic Review ${review.id} for Project ${review.projectId} is due in ${diffDays} days.`
            );
          } else if (diffDays <= 0 && review.status === "SCHEDULED") {
            await review.update({ status: "OVERDUE" });
            console.log(
              `[csv-service Cron] Alert: Periodic Review ${review.id} is OVERDUE!`
            );
          }
        }
      } catch (err) {
        console.error(
          "[csv-service Cron] Error running periodic review check:",
          err
        );
      }
    },
    24 * 60 * 60 * 1000
  ); // Every 24 hours
};
