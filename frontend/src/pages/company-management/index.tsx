import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { getCompany, updateCompany } from "@/services/admin.service";
import { Company } from "@/types/common.types";
import CreateCompanyModal from "./CreateCompanyModal";

const CompanyManagement = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();

  const [companies, setCompanies] = useState<Company>();
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [refresh, setRefresh] = useState(false);

  const fetchCompanies = async () => {
    const res = await getCompany();
    setCompanies(res.company);
  };

  useEffect(() => {
    fetchCompanies();
  }, [refresh]);

  const handleSave = async (data: any) => {
    if (activeCompany) {
      await updateCompany(activeCompany._id, data);
    }
    setActiveCompany(null);
    setRefresh((prev) => !prev);
    closeModal();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("company")}
        </h1>
      </div>

      <ul className="space-y-2">
        <li className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex justify-between items-center">
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {companies?.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {companies?.description}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              permission="OPERATE:ALL"
              onClick={() => {
                setActiveCompany(companies || null);
                openModal();
              }}
              variant="outline"
            >
              {t("edit")}
            </Button>
          </div>
        </li>
      </ul>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[90vh] m-4 overflow-y-auto"
      >
        <CreateCompanyModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeCompany || undefined}
        />
      </Modal>
    </>

  );
};

export default CompanyManagement;
