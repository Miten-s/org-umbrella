import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateDesignationModal from "./CreateDesignationModal";
import { useEffect, useState } from "react";
import { createDesignation, deleteDesignation, getDesignations, updateDesignation } from "@/services/admin.service";
import { Designation as DesignationObj } from "@/types/common.types";

const Designation = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();

  const [designations, setDesignations] = useState<DesignationObj[]>([]);
  const [activeDesignation, setActiveDesignation] = useState<DesignationObj | null>(null);
  const [refresh, setRefresh] = useState(false);

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

  const handleDelete = async (id: string) => {
    console.log('delete', id);
    await deleteDesignation(id);
    setRefresh((prev) => !prev);
  };

  useEffect(() => {
    fetchDesignations();
  }, [refresh]);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t("designations")}</h1>
        <Button
          onClick={() => {
            setActiveDesignation(null);
            openModal();
          }}
        >
          {t("create", { entity: t("designation") })}
        </Button>
      </div>

      {/* Replace this with a table later */}
      <ul className="space-y-2">
        {designations?.map((d) => (
          <li key={d._id} className="border p-2 rounded flex justify-between items-center">
            <div>
              <div className="font-medium">{d.designationName}</div>
              <div className="text-sm text-gray-500">{d.description}</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveDesignation(d);
                  openModal();
                }}
              >
                {t("edit")}
              </Button>
              <Button
              variant="destructive"
                onClick={() => handleDelete(d._id)}
              >
                {t("delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[900px] max-h-[90vh] m-4 overflow-y-auto">
        <CreateDesignationModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeDesignation || undefined}
        />
      </Modal>
    </>
  );
};

export default Designation;
