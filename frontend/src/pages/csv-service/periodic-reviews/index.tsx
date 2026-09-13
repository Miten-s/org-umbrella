import React, { useEffect, useState } from "react";
import { getPeriodicReviews } from "@/services/csv.service";
import { CsvPeriodicReview } from "@/types/csv.types";

const CSVPeriodicReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<CsvPeriodicReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const list = await getPeriodicReviews();
      setReviews(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          1-Year Periodic Review Maintenance Calendar
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          ISPE GAMP 5 & 21 CFR Part 11 Scheduled System Review Schedule
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading periodic review calendar...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No scheduled periodic reviews found. Schedule reviews from Step 8 in
            project workspace.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase">
                <th className="p-4">Scheduled Date</th>
                <th className="p-4">Project</th>
                <th className="p-4">Application</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">
                    {r.scheduledDate}
                  </td>
                  <td className="p-4 text-blue-600 font-medium">
                    {r.project?.projectTitle || r.projectId}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    {r.application?.name || r.appId}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        r.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "OVERDUE"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CSVPeriodicReviewsPage;
