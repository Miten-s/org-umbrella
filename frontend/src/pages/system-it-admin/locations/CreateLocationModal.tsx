import { useForm } from "react-hook-form";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";
// import dayjs from "dayjs";
import TextArea from "@/components/common/form/input/TextArea";

interface CreateLocationModalProps {
  onClose: () => void;
  defaultValues?: {
    name?: string;
    description?: string;
  };
}

const CreateLocationModal = ({ onClose, defaultValues }: CreateLocationModalProps) => {
  const { register, handleSubmit, setValue ,watch} = useForm({
    defaultValues: {
      locationName: defaultValues?.name || "",
      description: defaultValues?.description || "",
    }
  });

  const { t } = useTranslation();

  const onSubmit = async (data: any) => {
    console.log("Submit Location:", data);
    // API call here
    onClose();
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">{t("create", { entity: t("location") }) }</h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>{t("locationName")}</Label>
            <Input
              {...register("locationName", { required: true, maxLength: 40 })}
              placeholder="Enter location/group name"
            />
          </div>

          <div>
            <Label>{t("description")}</Label>
            <TextArea
              value={watch("description")}
              onChange={(event) => setValue("description", event)}
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

export default CreateLocationModal;
