import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateAssignmentGroupModal from "./CreateAssignmentGroupModal";
import Switch from "@/components/common/form/switch/Switch";
import {
  getAssignmentGroups,
  createAssignmentGroup,
  updateAssignmentGroup,
  deleteAssignmentGroup,
  enableAssignmentGroup,
  disableAssignmentGroup,
} from "@/services/gxp.service";
import { AssignmentGroup } from "@/types/common.types"; // Assuming AssignmentGroup type will be here
import { useGlobalContext } from "@/context";

const AssignmentGroups = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [assignmentGroups, setAssignmentGroups] = useState<AssignmentGroup[]>([]);
  const [activeAssignmentGroup, setActiveAssignmentGroup] = useState<AssignmentGroup | null>(null);
  const [assignmentGroupToDelete, setAssignmentGroupToDelete] = useState<AssignmentGroup | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const [confirmationModal, setConfirmationModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const groups = await getAssignmentGroups(includeInactive);
      setAssignmentGroups(groups);
    };
    fetchInitialData();
  }, [reFetch, includeInactive]);

  // Create or Update
  const handleSave = async (data: Partial<AssignmentGroup>) => {
    if (activeAssignmentGroup) {
      const updated = await updateAssignmentGroup(activeAssignmentGroup._id, data);
      setAssignmentGroups((prev) =>
        prev.map((group) => (group._id === updated._id ? updated : group))
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
    setAssignmentGroups((prev) => prev.filter((s) => s._id !== assignmentGroupToDelete._id));

    setConfirmationModal(false);
    setAssignmentGroupToDelete(null);
  };

  const handleStatusChange = async (group: AssignmentGroup) => {
    const newStatus = group.isActive ? false : true; // Assuming isActive is boolean
    if (newStatus) {
      await enableAssignmentGroup(group.groupName);
    } else {
      await disableAssignmentGroup(group.groupName);
    }
    setAssignmentGroups((prev) =>
      prev.map((s) =>
        s._id === group._id ? { ...s, isActive: newStatus } : s
      )
    );
  };

  const openEditModal = (group: AssignmentGroup) => {
    setActiveAssignmentGroup(group);
    openModal();
  };

  return (
    <>
      {/* Header and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpAssignmentGroups")}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              label={t("includeInactive")}
              checked={includeInactive}
              onChange={() => setIncludeInactive(!includeInactive)}
            />
          </div>
          <Button
            // permission="CREATE:ASSIGNMENT_GROUP" // Placeholder for permission
            tooltipPosition="left"
            onClick={() => {
              openModal();
              setActiveAssignmentGroup(null);
            }}
          >
            {t("create", { entity: t("assignmentGroup") })}
          </Button>
        </div>
      </div>

      {/* Assignment Group Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {["groupName", "manager", "members", "description", "status", "actions"].map((key) => (
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
            {assignmentGroups?.map((group) => (
              <tr key={group._id}>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {group.groupName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {group.manager?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {group.members?.map(m => m.name).join(", ")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {group.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <Switch
                    label={group.isActive ? t("active") : t("inactive")}
                    checked={group.isActive}
                    onChange={() => handleStatusChange(group)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-300">
                  <Button
                    // permission="UPDATE:ASSIGNMENT_GROUP" // Placeholder for permission
                    onClick={() => openEditModal(group)}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    // permission="DELETE:ASSIGNMENT_GROUP" // Placeholder for permission
                    onClick={() => {
                      setAssignmentGroupToDelete(group);
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

            {assignmentGroups?.length === 0 && (
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
            <Button variant="outline" type="button" onClick={() => setConfirmationModal(false)}>
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
