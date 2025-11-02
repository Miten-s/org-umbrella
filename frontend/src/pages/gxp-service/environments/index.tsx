import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import {
  getEnvironments,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from "@/services/gxp.service";
import { useGlobalContext } from "@/context";
import CreateEnvironmentModal from "./CreateEnvironmentModal";

interface Environment {
  _id: string;
  environmentName: string;
  description: string;
}

const Environments = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(null);
  const [environmentToDelete, setEnvironmentToDelete] = useState<Environment | null>(null);
  const [confirmationModal, setConfirmationModal] = useState(false);


  useEffect(() => {
    const fetchEnvironments = async () => {
      const environments = await getEnvironments();
      setEnvironments(environments);
    };

    fetchEnvironments();
  }, [reFetch]);

  const handleSave = async (data: Partial<Environment>) => {
    const payload = {
      ...data,
    };
    if (activeEnvironment) {
      await updateEnvironment(activeEnvironment._id, payload);
    } else {
      await createEnvironment(payload);
    }
    setReFetch(!reFetch);
    closeModal();
    setActiveEnvironment(null);
  };

  const confirmDelete = async () => {
    if (!environmentToDelete) return;

    await deleteEnvironment(environmentToDelete._id);
    setEnvironments((prev) => prev.filter((d) => d._id !== environmentToDelete._id));

    setConfirmationModal(false);
    setEnvironmentToDelete(null);
  };

  const openEditModal = (environment: Environment) => {
    setActiveEnvironment(environment);
    openModal();
  };



  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("environments")}
        </h1>
        <div className="flex items-center gap-4">

          <Button
            onClick={() => {
              setActiveEnvironment(null);
              openModal();
            }}
          >
            {t("create", { entity: t("environment") })}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                {t("environmentName")}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                {t("description")}
              </th>

              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">{t("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
            {environments?.map((environment) => (
              <tr key={environment._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {environment.environmentName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {environment.description}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={() => openEditModal(environment)}
                      variant="outline"
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      onClick={() => {
                        setEnvironmentToDelete(environment);
                        setConfirmationModal(true);
                      }}
                      variant="destructive"
                    >
                      {t("delete")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateEnvironmentModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeEnvironment || undefined}
        />
      </Modal>

      <Modal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(false)}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {t("deleteEntityPrompt", {
              entityName: environmentToDelete?.environmentName,
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

export default Environments;