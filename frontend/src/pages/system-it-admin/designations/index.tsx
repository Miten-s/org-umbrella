import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateDesignationModal from "./CreateDesignationModal";

const Designation = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t("designations")}</h1>
        <Button onClick={openModal}>
          {t("create", { entity: t("designation") })}
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[900px] max-h-[90vh] m-4 overflow-y-auto"
      >
        <CreateDesignationModal onClose={closeModal} />
      </Modal>
    </>
  );
};

export default Designation;
