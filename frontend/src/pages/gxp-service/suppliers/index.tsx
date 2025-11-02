import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateSupplierModal from "./CreateSupplierModal";
import Switch from "@/components/common/form/switch/Switch";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  enableSupplier,
  disableSupplier,
} from "@/services/gxp.service";
import { Supplier } from "@/types/common.types";
import { useGlobalContext } from "@/context";

const Suppliers = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [includeDisabled, setIncludeDisabled] = useState(false);

  const [confirmationModal, setConfirmationModal] = useState(false);

  useEffect(() => {

      const fetchInitialData = async () => {

        const suppliers = await getSuppliers(includeDisabled);

        setSuppliers(suppliers);

      };

      fetchInitialData();

    }, [reFetch, includeDisabled]);

  // Create or Update
  const handleSave = async (data: Partial<Supplier>) => {
    if (activeSupplier) {
      const updated = await updateSupplier(activeSupplier._id, data);
      setSuppliers((prev) =>
        prev.map((sup) => (sup._id === updated._id ? updated : sup))
      );
    } else {
      const created = await createSupplier(data);
      setSuppliers((prev) => [created, ...prev]);
    }
    setReFetch(!reFetch);
    closeModal();
    setActiveSupplier(null);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    await deleteSupplier(supplierToDelete._id);
    setSuppliers((prev) => prev.filter((s) => s._id !== supplierToDelete._id));

    setConfirmationModal(false);
    setSupplierToDelete(null);
  };

  const handleStatusChange = async (supplier: Supplier) => {
    const newStatus = supplier.status === "enabled" ? "disabled" : "enabled";
    if (newStatus === "enabled") {
      await enableSupplier(supplier._id);
    } else {
      await disableSupplier(supplier._id);
    }
    setSuppliers((prev) =>
      prev.map((s) =>
        s._id === supplier._id ? { ...s, status: newStatus } : s
      )
    );
  };

  const openEditModal = (supplier: Supplier) => {
    setActiveSupplier(supplier);
    openModal();
  };

  return (
    <>
      {/* Header and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpSuppliers")}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              label={t("includeDisabled")}
              checked={includeDisabled}
              onChange={() => setIncludeDisabled(!includeDisabled)}
            />
          </div>
          <Button
            // permission="CREATE:SUPPLIER"
            tooltipPosition="left"
            onClick={() => {
              setActiveSupplier(null);
              openModal();
            }}
          >
            {t("create", { entity: t("supplier") })}
          </Button>
        </div>
      </div>

      {/* Supplier Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['supplierName', 'product', 'status', 'actions'].map((key) => (
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
            {suppliers?.map((s) => (
              <tr key={s._id}>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {s.supplierName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {s.product}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <Switch
                    label={s.status === "enabled" ? t("enabled") : t("disabled")}
                    checked={s.status === "enabled"}
                    onChange={() => handleStatusChange(s)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-300">
                  <Button
                    // permission="UPDATE:SUPPLIER"
                    onClick={() => openEditModal(s)}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    // permission="DELETE:SUPPLIER"
                    onClick={() => {
                      setSupplierToDelete(s);
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

            {suppliers?.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                >
                  {t("noRecordsFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Supplier Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[100rem]  m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >

        <CreateSupplierModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeSupplier || undefined}
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
              entityName: supplierToDelete?.supplierName,
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

export default Suppliers;