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
  getAssignmentGroups,
} from "@/services/gxp.service";
import { Workflow } from "@/types/common.types";
import { useGlobalContext } from "@/context";

const Workflows = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [assignmentGroups, setAssignmentGroups] = useState<any[]>([]);


  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);

  const [confirmationModal, setConfirmationModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { workflows } = await getWorkflows();
      const { data } = await getAssignmentGroups();
      setAssignmentGroups(data);
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
          // permission="CREATE:WORKFLOW"
          tooltipPosition="left"
          onClick={() => {
            setActiveWorkflow(null);
            openModal();
          }}
        >
          {t("create", { entity: t("gxpWorkflows") })}
        </Button>
      </div>

      {/* Workflow List */}
      <ul className="space-y-2">
        {workflows?.map((wf) => (
          <li
            key={wf._id}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex justify-between items-start gap-4"
          >
            <div className="flex-1">
              <div className="font-semibold text-lg text-gray-900 dark:text-white">
                {wf.workflowName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Levels: {wf.levels.join(", ")}
              </div>
              {wf.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {wf.description}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                // permission="UPDATE:WORKFLOW"
                onClick={() => openEditModal(wf)}
                variant="outline"
              >
                {t("edit")}
              </Button>
              <Button
                // permission="DELETE:WORKFLOW"
                onClick={() => {
                  setWorkflowToDelete(wf);
                  setConfirmationModal(true);
                }}
                variant="destructive"
              >
                {t("delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* Create/Edit Workflow Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[100rem]  m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >

        <CreateWorkflowModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeWorkflow || undefined}
          assignmentGroups={assignmentGroups}
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