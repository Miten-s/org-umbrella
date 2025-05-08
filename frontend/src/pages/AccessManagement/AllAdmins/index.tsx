import Button from '../../../components/ui/button/Button';
import CreateAdminModal from './CreateAdminModal';
import { useModal } from '../../../hooks/useModal';
import { Modal } from '../../../components/ui/modal';

const AllAdmins = () => {
  const { isOpen, openModal, closeModal } = useModal();

  const handleCreateAdmin = (data: any) => {
    console.log('Creating admin:', data);
    closeModal()
  };

  const multiOptions = [
    { value: "1", text: "Option 1", selected: false },
    { value: "2", text: "Option 2", selected: false },
    { value: "3", text: "Option 3", selected: false },
    { value: "4", text: "Option 4", selected: false },
    { value: "5", text: "Option 5", selected: false },
  ];
  return (
    <div className="">
      <div className="">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">All Admins</h1>
          <Button
            onClick={openModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Admin
          </Button>
        </div>

        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[1000px] max-h-[50rem]  m-4">
          <CreateAdminModal
            roles={multiOptions}
            onClose={closeModal}
            onSubmit={handleCreateAdmin}
            currentUser="superadmin"
          />
        </Modal>

        {/* Render your list of admins here */}
      </div>
    </div>
  );
};

export default AllAdmins;




;