import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateDesignationModal from "./CreateDesignationModal";
import { useEffect, useState } from "react";
import {
  createDesignation,
  deleteDesignation,
  getDesignations,
  updateDesignation
} from "@/services/admin.service";
import { Designation as DesignationObj } from "@/types/common.types";

const Designation = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();

  const [designations, setDesignations] = useState<DesignationObj[]>([]);
  const [activeDesignation, setActiveDesignation] = useState<DesignationObj | null>(null);
  const [refresh, setRefresh] = useState(false);

  const [confirmationModal, setConfirmationModal] = useState(false);
  const [designationToDelete, setDesignationToDelete] = useState<DesignationObj | null>(null);

  const fetchDesignations = async () => {
    const { designations: fetchDesignations } = await getDesignations();
    setDesignations(fetchDesignations);
  };

  useEffect(() => {
    fetchDesignations();
  }, [refresh]);

  const handleSave = async (data: Partial<DesignationObj>) => {
    if (activeDesignation) {
      await updateDesignation(activeDesignation._id, data);
    } else {
      await createDesignation(data);
    }
    setActiveDesignation(null);
    setRefresh((prev) => !prev);
    closeModal();
  };

  const confirmDelete = async () => {
    if (designationToDelete) {
      await deleteDesignation(designationToDelete._id);
      setRefresh((prev) => !prev);
      setConfirmationModal(false);
      setDesignationToDelete(null);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("designations")}
        </h1>
        <Button
          permission="CREATE:DESIGNATION"
          tooltipPosition="left"
          onClick={() => {
            setActiveDesignation(null);
            openModal();
          }}
        >
          {t("create", { entity: t("designation") })}
        </Button>
      </div>

      {/* Designation List */}
       <ul className="space-y-2">
        {designations?.map((d) => (
          <li
            key={d._id}
            className="border p-4 rounded-xl flex justify-between items-center bg-white dark:bg-gray-800 dark:border-gray-700"
          >
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {d.designationName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {d.description}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                permission="UPDATE:DESIGNATION"
                onClick={() => {
                  setActiveDesignation(d);
                  openModal();
                }}
                variant="outline"
              >
                {t("edit")}
              </Button>
              <Button
                permission="DELETE:DESIGNATION"
                onClick={() => {
                  setDesignationToDelete(d);
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[90vh] m-4 overflow-y-auto dark:bg-gray-900"
      >
        <CreateDesignationModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeDesignation || undefined}
        />
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(false)}
        className="max-w-[600px] min-h-[150px] m-4 dark:bg-gray-900"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-200">
            {t("deleteEntityPrompt", {
              entityName: designationToDelete?.designationName,
            })}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmationModal(false)}
              className="px-4 py-2"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={confirmDelete}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              {t("confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>

  );
};

export default Designation;
