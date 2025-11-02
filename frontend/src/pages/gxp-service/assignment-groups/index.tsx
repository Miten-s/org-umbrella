import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateAssignmentGroupModal from "./CreateAssignmentGroupModal";
import {
  getAssignmentGroups,
  createAssignmentGroup,
  updateAssignmentGroup,
  deleteAssignmentGroup,
} from "@/services/gxp.service";
import { getUsers } from "@/services/admin.service";
import { AssignmentGroup, User } from "@/types/common.types";
import { useGlobalContext } from "@/context";

const AssignmentGroups = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [assignmentGroups, setAssignmentGroups] = useState<AssignmentGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [activeAssignmentGroup, setActiveAssignmentGroup] = useState<AssignmentGroup | null>(null);
  const [assignmentGroupToDelete, setAssignmentGroupToDelete] = useState<AssignmentGroup | null>(null);

  const [confirmationModal, setConfirmationModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [{ assignmentGroups }, { users }] = await Promise.all([
        getAssignmentGroups(),
        getUsers(),
      ]);
      setAssignmentGroups(assignmentGroups);
      setUsers(users);
    };

    fetchInitialData();
  }, [reFetch]);

  // Create or Update
  const handleSave = async (data: Partial<AssignmentGroup>) => {
    if (activeAssignmentGroup) {
      const updated = await updateAssignmentGroup(activeAssignmentGroup._id, data);
      setAssignmentGroups((prev) =>
        prev.map((ag) => (ag._id === updated._id ? updated : ag))
      );
    } else {
      const created = await createAssignmentGroup(data);
      setAssignmentGroups((prev) => [created, ...prev]);
    }
    setReFetch(!reFetch);
    closeModal();
    setActiveAssignmentGroup(null);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!assignmentGroupToDelete) return;

    await deleteAssignmentGroup(assignmentGroupToDelete._id);
    setAssignmentGroups((prev) => prev.filter((ag) => ag._id !== assignmentGroupToDelete._id));

    setConfirmationModal(false);
    setAssignmentGroupToDelete(null);
  };

  const openEditModal = (assignmentGroup: AssignmentGroup) => {
    setActiveAssignmentGroup(assignmentGroup);
    openModal();
  };

  return (
    <>
      {/* Header and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpAssignmentGroups")}
        </h1>
        <Button
          // permission="CREATE:ASSIGNMENT_GROUP"
          tooltipPosition="left"
          onClick={() => {
            setActiveAssignmentGroup(null);
            openModal();
          }}
        >
          {t("create", { entity: t("gxpAssignmentGroups") })}
        </Button>
      </div>

      {/* Assignment Group List */}
      <ul className="space-y-2">
        {assignmentGroups.map((ag) => (
          <li
            key={ag._id}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex justify-between items-start gap-4"
          >
            <div className="flex-1">
              <div className="font-semibold text-lg text-gray-900 dark:text-white">
                {ag.groupName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manager: {ag.manager.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Members: {ag.members.map(m => m.name).join(", ")}
              </div>
              {ag.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {ag.description}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                // permission="UPDATE:ASSIGNMENT_GROUP"
                onClick={() => openEditModal(ag)}
                variant="outline"
              >
                {t("edit")}
              </Button>
              <Button
                // permission="DELETE:ASSIGNMENT_GROUP"
                onClick={() => {
                  setAssignmentGroupToDelete(ag);
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

      {/* Create/Edit Assignment Group Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[100rem]  m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >

        <CreateAssignmentGroupModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeAssignmentGroup || undefined}
          users={users}
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
              entityName: assignmentGroupToDelete?.groupName,
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

export default AssignmentGroups;