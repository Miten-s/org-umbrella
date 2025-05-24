import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateUserModal from "./CreateUserModal";
import { getRoles } from "@/services/admin.service";
import { useEffect, useState } from "react";

const Users = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const [roles, setRoles] = useState<any>([]);
  const fetchDetails = async () => {
    const { roles: fetchedRoles } = await getRoles();
    setRoles(
      fetchedRoles.map((role: any) => ({ text: role.name, value: role._id }))
    );
  };

  useEffect(() => {
    fetchDetails();
  }, []);
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t("users")}</h1>
        <Button onClick={openModal}>{t("create", { entity: t("user") })}</Button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[1000px] max-h-[50rem]  m-4">
        <CreateUserModal onClose={closeModal} roles={roles} />
      </Modal>
    </>
  );
};

export default Users;
