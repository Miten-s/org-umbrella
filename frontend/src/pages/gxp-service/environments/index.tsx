import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateEnvironmentModal from "./CreateEnvironmentModal";
import {
  getEnvironments,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from "@/services/gxp.service";
import { Environment } from "@/types/common.types";
import { useGlobalContext } from "@/context";

const Environments = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [environments, setEnvironments] = useState<Environment[]>([]);

  const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(null);
  const [environmentToDelete, setEnvironmentToDelete] = useState<Environment | null>(null);

  const [confirmationModal, setConfirmationModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { environments } = await getEnvironments();
      setEnvironments(environments);
    };

    fetchInitialData();
  }, [reFetch]);

  // Create or Update
  const handleSave = async (data: Partial<Environment>) => {
    if (activeEnvironment) {
      const updated = await updateEnvironment(activeEnvironment._id, data);
      setEnvironments((prev) =>
        prev.map((env) => (env._id === updated._id ? updated : env))
      );
    } else {
      const created = await createEnvironment(data);
      setEnvironments((prev) => [created, ...prev]);
    }
    setReFetch(!reFetch);
    closeModal();
    setActiveEnvironment(null);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!environmentToDelete) return;

    await deleteEnvironment(environmentToDelete._id);
    setEnvironments((prev) => prev.filter((env) => env._id !== environmentToDelete._id));

    setConfirmationModal(false);
    setEnvironmentToDelete(null);
  };

  const openEditModal = (environment: Environment) => {
    setActiveEnvironment(environment);
    openModal();
  };

  return (
    <>
      {/* Header and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpEnvironments")}
        </h1>
        <Button
          // permission="CREATE:ENVIRONMENT"
          tooltipPosition="left"
          onClick={() => {
            setActiveEnvironment(null);
            openModal();
          }}
        >
          {t("create", { entity: t("gxpEnvironments") })}
        </Button>
      </div>

      {/* Environment List */}
      <ul className="space-y-2">
        {environments.map((env) => (
          <li
            key={env._id}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex justify-between items-start gap-4"
          >
            <div className="flex-1">
              <div className="font-semibold text-lg text-gray-900 dark:text-white">
                {env.environmentName}
              </div>
              {env.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {env.description}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                // permission="UPDATE:ENVIRONMENT"
                onClick={() => openEditModal(env)}
                variant="outline"
              >
                {t("edit")}
              </Button>
              <Button
                // permission="DELETE:ENVIRONMENT"
                onClick={() => {
                  setEnvironmentToDelete(env);
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

      {/* Create/Edit Environment Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[100rem]  m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >

        <CreateEnvironmentModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeEnvironment || undefined}
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