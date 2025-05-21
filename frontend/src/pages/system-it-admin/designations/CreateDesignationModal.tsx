import { useForm } from "react-hook-form";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";

interface CreateDesignationModalProps {
  onClose: () => void;
}

const CreateDesignationModal = ({ onClose }: CreateDesignationModalProps) => {
  const { register, handleSubmit } = useForm();
  const { t } = useTranslation();

  const onSubmit = async (data: any) => {
    // handle submission logic here
    console.log("Designation data:", data);
    onClose();
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">{t("createDesignation")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Designation Name</Label>
            <Input
              {...register("designationName", {
                required: true,
                maxLength: 50,
              })}
              placeholder="Enter designation name"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              {...register("description", {
                maxLength: 100,
              })}
              placeholder="Enter description"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" variant="primary">
            {t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateDesignationModal;
