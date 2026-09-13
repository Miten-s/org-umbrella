import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getProjects,
  getApplications,
  createProject,
  createApplication
} from "@/services/csv.service";
import { CsvProject, CsvApplication } from "@/types/csv.types";
import { toast } from "@/lib/toast";

const CSVProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<CsvProject[]>([]);
  const [applications, setApplications] = useState<CsvApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateProjectModal, setShowCreateProjectModal] =
    useState<boolean>(false);
  const [showCreateAppModal, setShowCreateAppModal] = useState<boolean>(false);

  // Form State
  const [appId, setAppId] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [gxpChangeControlId, setGxpChangeControlId] = useState<string>("");

  const [newAppCode, setNewAppCode] = useState<string>("");
  const [newAppName, setNewAppName] = useState<string>("");
  const [newGxpClassification, setNewGxpClassification] =
    useState<string>("GXP");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projList, appList] = await Promise.all([
        getProjects(),
        getApplications()
      ]);
      setProjects(projList);
      setApplications(appList);
      if (appList.length > 0 && !appId) {
        setAppId(appList[0].id);
      }
    } catch (err) {
      console.error("Failed to load CSV projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId || !projectTitle) {
      toast("Application and Project Title are required.", "info");
      return;
    }
    try {
      await createProject({
        appId,
        projectTitle,
        gxpChangeControlId: gxpChangeControlId || undefined
      });
      setShowCreateProjectModal(false);
      setProjectTitle("");
      setGxpChangeControlId("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppCode || !newAppName) {
      toast("App Code and Name are required.", "info");
      return;
    }
    try {
      const app = await createApplication({
        appCode: newAppCode,
        name: newAppName,
        gxpClassification: newGxpClassification
      });
      setAppId(app.id);
      setShowCreateAppModal(false);
      setNewAppCode("");
      setNewAppName("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getPhaseBadgeColor = (phase: string) => {
    switch (phase) {
      case "INTAKE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
      case "DESIGN_SPEC":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
      case "TEST_EXECUTION":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
      case "VALIDATED":
      case "READ_ONLY":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Computer Software Validation (CSV) Projects
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            21 CFR Part 11 & EU GMP Annex 11 Compliant System Lifecycle
            Dashboard
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateAppModal(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            + Register Application
          </button>

          <button
            onClick={() => setShowCreateProjectModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            + New Validation Project
          </button>
        </div>
      </div>

      {/* Projects List Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Active Validation Projects ({projects.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Loading CSV validation projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            No validation projects found. Click "+ New Validation Project" to
            initiate Step 1 Intake.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Project Title</th>
                  <th className="py-3.5 px-6">Application</th>
                  <th className="py-3.5 px-6">Change Control ID</th>
                  <th className="py-3.5 px-6">Phase</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {projects.map((proj) => (
                  <tr
                    key={proj.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                      {proj.projectTitle}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                      {proj.application?.name || proj.appId}
                    </td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {proj.gxpChangeControlId || "N/A"}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPhaseBadgeColor(
                          proj.currentPhase
                        )}`}
                      >
                        {proj.currentPhase}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {proj.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Link
                        to={`/csv-service/projects/${proj.id}`}
                        className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
                      >
                        Open Workspace &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Application */}
      {showCreateAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Register New GxP Application
            </h3>
            <form onSubmit={handleCreateApp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Application Code (e.g. APP-LIMS)
                </label>
                <input
                  type="text"
                  value={newAppCode}
                  onChange={(e) => setNewAppCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="APP-GLUCOSE"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="Glucose Monitoring System"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  GxP Classification
                </label>
                <select
                  value={newGxpClassification}
                  onChange={(e) => setNewGxpClassification(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="GXP">GXP (Regulated)</option>
                  <option value="NON_GXP">Non-GXP</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateAppModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Project */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Initiate New Validation Project (Step 1 Intake)
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select Application
                </label>
                <select
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="" disabled>
                    -- Select Application --
                  </option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name} ({app.appCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="e.g. Glucose Calculator Validation"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  GxP Change Control ID (Optional)
                </label>
                <input
                  type="text"
                  value={gxpChangeControlId}
                  onChange={(e) => setGxpChangeControlId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="CC-2026-88"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVProjectsPage;
