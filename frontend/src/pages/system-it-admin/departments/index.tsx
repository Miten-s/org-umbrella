import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateDepartmentModal from "./CreateDepartmentModal";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getLocations,
  getUsers,
} from "@/services/admin.service";
import { Department, Location } from "@/types/common.types";
import { useGlobalContext } from "@/context";

const Departments = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch, } = useGlobalContext();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  const [activeDepartment, setActiveDepartment] = useState<Department | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  const [confirmationModal, setConfirmationModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [{ departments }, { locations }, { users }] = await Promise.all([
        getDepartments(),
        getLocations(),
        getUsers(),
      ]);
      setDepartments(departments);
      setLocations(locations);
      setManagers(users);
    };

    fetchInitialData();
  }, [reFetch]);

  // Create or Update
  const handleSave = async (data: Partial<Department>) => {
    if (activeDepartment) {
      const updated = await updateDepartment(activeDepartment._id, data);
      setDepartments((prev) =>
        prev.map((dep) => (dep._id === updated._id ? updated : dep))
      );
    } else {
      const created = await createDepartment(data);
      setDepartments((prev) => [created, ...prev]);
    }
    setReFetch(!reFetch);
    closeModal();
    setActiveDepartment(null);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!departmentToDelete) return;

    await deleteDepartment(departmentToDelete._id);
    setDepartments((prev) => prev.filter((d) => d._id !== departmentToDelete._id));

    setConfirmationModal(false);
    setDepartmentToDelete(null);
  };

  const openEditModal = (department: Department) => {
    setActiveDepartment(department);
    openModal();
  };

  return (
    <>
      {/* Header and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("departments")}
        </h1>
        <Button
          permission="CREATE:DEPARTMENT"
          tooltipPosition="left"
          onClick={() => {
            setActiveDepartment(null);
            openModal();
          }}
        >
          {t("create", { entity: t("department") })}
        </Button>
      </div>

      {/* Department List */}
      <ul className="space-y-2">
        {departments.map((d) => (
          <li
            key={d._id}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex justify-between items-start gap-4"
          >
            <div className="flex-1">
              <div className="font-semibold text-lg text-gray-900 dark:text-white">
                {d.departmentName}
              </div>
              {d.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {d.description}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                permission="UPDATE:DEPARTMENT"
                onClick={() => openEditModal(d)}
                variant="outline"
              >
                {t("edit")}
              </Button>
              <Button
                permission="DELETE:DEPARTMENT"
                onClick={() => {
                  setDepartmentToDelete(d);
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

      {/* Create/Edit Department Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[90vh] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateDepartmentModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeDepartment || undefined}
          locations={locations}
          managers={managers}
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
              entityName: departmentToDelete?.departmentName,
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

export default Departments;
