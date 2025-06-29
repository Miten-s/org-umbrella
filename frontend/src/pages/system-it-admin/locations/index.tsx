import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import CreateLocationModal from "./CreateLocationModal";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation
} from "@/services/admin.service";
import { Location as LocationObj } from "@/types/common.types";

const Location = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();

  const [locations, setLocations] = useState<LocationObj[]>([]);
  const [activeLocation, setActiveLocation] = useState<LocationObj | null>(null);
  const [refresh, setRefresh] = useState(false);

  const [confirmationModal, setConfirmationModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<LocationObj | null>(null);

  const fetchLocations = async () => {
    const { locations: fetchedLocations } = await getLocations();
    setLocations(fetchedLocations);
  };

  useEffect(() => {
    fetchLocations();
  }, [refresh]);

  const handleSave = async (data: Partial<LocationObj>) => {
    if (activeLocation) {
      await updateLocation(activeLocation._id, data);
    } else {
      await createLocation(data);
    }
    setActiveLocation(null);
    setRefresh((prev) => !prev);
    closeModal();
  };

  const confirmDelete = async () => {
    if (locationToDelete) {
      await deleteLocation(locationToDelete._id);
      setRefresh((prev) => !prev);
      setConfirmationModal(false);
      setLocationToDelete(null);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("locationsGroups")}
        </h1>
        <Button
          permission="CREATE:LOCATION"
          tooltipPosition="left"
          onClick={() => {
            setActiveLocation(null);
            openModal();
          }}
        >
          {t("create", { entity: t("location") })}
        </Button>
      </div>

      {/* List of Location Groups */}
      <ul className="space-y-2">
        {locations.map((loc) => (
          <li
            key={loc._id}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex justify-between items-center"
          >
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {loc.locationName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {loc.description}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                permission="UPDATE:LOCATION"
                onClick={() => {
                  setActiveLocation(loc);
                  openModal();
                }}
                variant="outline"
              >
                {t("edit")}
              </Button>
              <Button
                permission="DELETE:LOCATION"
                onClick={() => {
                  setLocationToDelete(loc);
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[90vh] m-4 overflow-y-auto"
      >
        <CreateLocationModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeLocation || undefined}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(false)}
        className="max-w-[600px] min-h-[150px] m-4"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          <div className="py-2">
            {`${t("deleteEntityPrompt", {
              entityName: locationToDelete?.locationName,
            })}`}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmationModal(false)}
              className="px-4 py-2"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={confirmDelete}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              {t("confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>

  );
};

export default Location;
