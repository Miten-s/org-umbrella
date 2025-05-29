import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateUserModal from "./CreateUserModal";
import { getRoles, getLocations, getDepartments, getDesignations, createUser, updateUser, getUsers } from "@/services/admin.service";
import { useEffect, useState } from "react";

const Users = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const [roles, setRoles] = useState<any>([]);
  const [locations, setLocations] = useState<any>([]);
  const [departments, setDepartments] = useState<any>([]);
  const [designations, setDesignations] = useState<any>([]);
  const [users, setUsers] = useState<any>([]);
  const [activeUser, setActiveUser] = useState<any>(null);
console.log(users)
  const fetchDetails = async () => {
    try {
      const [
        { roles: fetchedRoles },
        { locations: fetchedLocations },
        { departments: fetchedDepartments },
        { designations: fetchedDesignations },
        { users: fetchedUsers }
      ] = await Promise.all([
        getRoles(),
        getLocations(),
        getDepartments(),
        getDesignations(),
        getUsers()
      ]);

      setRoles(fetchedRoles.map((role: any) => ({ text: role.name, value: role._id , type: role.type})));
      setLocations(fetchedLocations.map((loc: any) => ({ text: loc.locationName, value: loc._id })));
      setDepartments(fetchedDepartments.map((dept: any) => ({ text: dept.departmentName, value: dept._id })));
      setDesignations(fetchedDesignations.map((desig: any) => ({ text: desig.designationName, value: desig._id })));
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleCreateUpdateUser = async (data: any) => {
    try {
      if (activeUser) {
        const payload = {
          ...data,
        };
        await updateUser(activeUser._id, payload);
      } else {
        const payload = {
          ...data,
        };
        await createUser(payload);
      }
      fetchDetails();
      closeModal();
      setActiveUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleOpenCreateModal = () => {
    setActiveUser(null);
    openModal();
  };

  // const handleOpenEditModal = (user: any) => {
  //   setActiveUser(user);
  //   openModal();
  // };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t("users")}</h1>
        <Button onClick={handleOpenCreateModal}>{t("create", { entity: t("user") })}</Button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[1000px] max-h-[50rem] m-4">
        <CreateUserModal 
          onClose={closeModal} 
          roles={roles}
          locations={locations}
          departments={departments}
          designations={designations}
          onSubmit={handleCreateUpdateUser}
          activeUser={activeUser}
        />
      </Modal>
    </>
  );
};

export default Users;
