// pages/department/index.tsx

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateDepartmentModal from "./CreateDepartmentModal";

const Departments = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t("departments")}</h1>
        <Button onClick={openModal}>
          {t("create", { entity: t("department") })}
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[90vh] m-4 overflow-y-auto"
      >
        <CreateDepartmentModal onClose={closeModal} />
      </Modal>
    </>
  );
};

export default Departments;
