import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useGlobalContext } from "@/context";

import CreateApplicationSoftwareModuleModal from "./CreateApplicationSoftwareModuleModal";

import {
  createApplicationSoftware, getApplicationSoftware,
  updateApplicationSoftware,
  deleteApplicationSoftware,
  enableApplicationSoftware,
  disableApplicationSoftware,
} from "@/services/gxp.service";
import Switch from "@/components/common/form/switch/Switch";

type ApplicationSoftwareModule = {
  _id: string;
  moduleName: string;
  status: "enabled" | "disabled";
  createdOn?: string | null;
  createdBy?: string | null;
  modifiedOn?: string | null;
  modifiedBy?: string | null;
};

const ensureArray = (val: any) =>
  Array.isArray(val) ? val : (val?.data && Array.isArray(val.data) ? val.data : []);

const GXPApplicationSoftwareModulePage = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const { reFetch, setReFetch } = useGlobalContext();

  const [modules, setModules] = useState<ApplicationSoftwareModule[]>([]);
  const [activeModule, setActiveModule] = useState<ApplicationSoftwareModule | null>(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<ApplicationSoftwareModule | null>(null);
  const [includeDisabled, setIncludeDisabled] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getApplicationSoftware(includeDisabled);
      setModules(ensureArray(res));
    })();
  }, [reFetch, includeDisabled]);

  const openEditModal = (m: ApplicationSoftwareModule) => {
    setActiveModule(m);
    openModal();
  };

  const handleSave = async (data: Partial<ApplicationSoftwareModule>) => {
    if (activeModule) {
      const updated = await updateApplicationSoftware(activeModule._id, data);
      setModules(prev => prev.map(m => (m._id === updated._id ? updated : m)));
    } else {
      const created = await createApplicationSoftware(data);
      setModules(prev => [created, ...prev]);
    }
    setActiveModule(null);
    setReFetch(!reFetch);
    closeModal();
  };

  const handleStatusChange = async (m: ApplicationSoftwareModule) => {
    const nextStatus: ApplicationSoftwareModule["status"] =
      m.status === "enabled" ? "disabled" : "enabled";

    // optimistic update
    setModules(prev =>
      prev.map(x => (x._id === m._id ? { ...x, status: nextStatus } : x))
    );

    try {
      if (nextStatus === "enabled") {
        await enableApplicationSoftware(m._id);
      } else {
        await disableApplicationSoftware(m._id);
      }
    } catch (e) {
      // rollback
      setModules(prev =>
        prev.map(x => (x._id === m._id ? { ...x, status: m.status } : x))
      );
      console.error("Module status update failed:", e);
    }
  };

  const confirmDelete = async () => {
    if (!moduleToDelete) return;
    await deleteApplicationSoftware(moduleToDelete._id);
    setModules(prev => prev.filter(m => m._id !== moduleToDelete._id));
    setModuleToDelete(null);
    setConfirmationModal(false);
  };

  return (
    <>
      {/* Header & Create */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpAppModules")}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              label={t("includeDisabled")}
              checked={includeDisabled}
              onChange={() => setIncludeDisabled((prev) => !prev)}
            />
          </div>
          <Button
            onClick={() => {
              setActiveModule(null);
              openModal();
            }}
          >
            {t("create", { entity: t("gxpAppModules") })}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {["moduleName", "status", "actions"].map(key => (
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
            {modules?.map(m => (
              <tr key={m._id}>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {m.moduleName}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <Switch
                    label={m.status === "enabled" ? t("enabled") : t("disabled")}
                    checked={m.status === "enabled"}
                    onChange={() => handleStatusChange(m)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-300">
                  <Button
                    onClick={() => openEditModal(m)}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    onClick={() => {
                      setModuleToDelete(m);
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

            {modules?.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                >
                  {t("noRecordsFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[700px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateApplicationSoftwareModuleModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeModule || undefined}
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
            {t("deleteEntityPrompt", { entityName: moduleToDelete?.moduleName })}
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

export default GXPApplicationSoftwareModulePage;
