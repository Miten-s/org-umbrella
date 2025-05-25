import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { createCompany, deleteCompany, getCompanies, updateCompany } from "@/services/admin.service";
import { Company } from "@/types/common.types";
import CreateCompanyModal from "./CreateCompanyModal";

const CompanyManagement = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [refresh, setRefresh] = useState(false);

  const fetchCompanies = async () => {
    const { companies: fetchedCompanies } = await getCompanies();
    setCompanies(fetchedCompanies);
  };

  useEffect(() => {
    fetchCompanies();
  }, [refresh]);

  const handleSave = async (data: Partial<Company>) => {
    if (activeCompany) {
      await updateCompany(activeCompany._id, data);
    } else {
      await createCompany(data);
    }
    setActiveCompany(null);
    setRefresh((prev) => !prev);
    closeModal();
  };

  const handleDelete = async (id: string) => {
    await deleteCompany(id);
    setRefresh((prev) => !prev);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t("company")}</h1>
        <Button
          onClick={() => {
            setActiveCompany(null);
            openModal();
          }}
        >
          {t("create", { entity: t("company") })}
        </Button>
      </div>

      <ul className="space-y-2">
        {companies.map((c) => (
          <li key={c._id} className="border p-2 rounded flex justify-between items-center">
            <div>
              <div className="font-medium">{c.companyName}</div>
              <div className="text-sm text-gray-500">{c.description}</div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveCompany(c);
                  openModal();
                }}
              >
                {t("edit")}
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(c._id)}>
                {t("delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[900px] max-h-[90vh] m-4 overflow-y-auto">
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
