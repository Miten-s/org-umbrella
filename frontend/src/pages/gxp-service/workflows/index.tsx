import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateWorkflowModal from "./CreateWorkflowModal";
import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  enableWorkflow,
  disableWorkflow,
} from "@/services/gxp.service";
import { Workflow } from "@/types/common.types";
import { useGlobalContext } from "@/context";
import Switch from "@/components/common/form/switch/Switch";

const Workflows = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const [confirmationModal, setConfirmationModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const workflows = await getWorkflows();
      setWorkflows(workflows);
    };
    fetchInitialData();
  }, [reFetch]);

  // Create or Update
  const handleSave = async (data: Partial<Workflow>) => {
    if (activeWorkflow) {
      const updated = await updateWorkflow(activeWorkflow._id, data);
      setWorkflows((prev) =>
        prev.map((wf) => (wf._id === updated._id ? updated : wf))
      );
    } else {
      const created = await createWorkflow(data);
      setWorkflows((prev) => [created, ...prev]);
    }
    setReFetch(!reFetch);
    closeModal();
    setActiveWorkflow(null);
  };

  // Toggle Status (enabled/disabled)
  const handleStatusChange = async (wf: Workflow) => {
    const newStatus = wf.status === "enabled" ? "disabled" : "enabled";
    setWorkflows((prev) =>
      prev.map((w) => (w._id === wf._id ? { ...w, status: newStatus } : w))
    );
    try {
      if (newStatus === "enabled") {
        await enableWorkflow(wf._id);
      } else {
        await disableWorkflow(wf._id);
      }
    } catch (err) {
      setWorkflows((prev) =>
        prev.map((w) => (w._id === wf._id ? { ...w, status: wf.status } : w))
      );
      console.error("Workflow status update failed:", err);
    }
  };


  // Confirm Delete
  const confirmDelete = async () => {
    if (!workflowToDelete) return;
    await deleteWorkflow(workflowToDelete._id);
    setWorkflows((prev) => prev.filter((wf) => wf._id !== workflowToDelete._id));
    setConfirmationModal(false);
    setWorkflowToDelete(null);
  };

  const openEditModal = (workflow: Workflow) => {
    setActiveWorkflow(workflow);
    openModal();
  };

  return (
    <>
      {/* Header and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpWorkflows")}
        </h1>
        <Button
          onClick={() => {
            setActiveWorkflow(null);
            openModal();
          }}
        >
          {t("create", { entity: t("gxpWorkflows") })}
        </Button>
      </div>

      {/* Workflow Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {[
                "workflowName",
                "numberOfLevels",
                "levels",
                "description",
                "status",
                "actions",
              ].map((key) => (
                <th
                  key={key}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {t(key)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {workflows?.map((wf) => (
              <tr key={wf._id}>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {wf.workflowName}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {wf.numberOfLevels ?? wf.levels?.length ?? 0}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {Array.isArray(wf.levels) ? wf.levels.join(", ") : "-"}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {wf.description ?? "-"}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <Switch
                    label={wf.status === "enabled" ? t("enabled") : t("disabled")}
                    checked={wf.status === "enabled"}
                    onChange={() => handleStatusChange(wf)}
                  />
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-300">
                  <Button
                    onClick={() => openEditModal(wf)}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    onClick={() => {
                      setWorkflowToDelete(wf);
                      setConfirmationModal(true);
                    }}
                    variant="destructive"
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {t("delete")}
                  </Button>
                </td>
              </tr>
            ))}

            {workflows?.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                >
                  {t("noRecordsFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Workflow Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateWorkflowModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeWorkflow || undefined}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(false)}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {t("deleteEntityPrompt", {
              entityName: workflowToDelete?.workflowName,
            })}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmationModal(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={confirmDelete} variant="destructive">
              {t("confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Workflows;
