import { useForm } from "react-hook-form";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";
// import dayjs from "dayjs";
import { useEffect } from "react";

interface CreateLocationModalProps {
  onClose: () => void;
  defaultValues?: {
    name?: string;
    description?: string;
  };
}

const CreateLocationModal = ({ onClose, defaultValues }: CreateLocationModalProps) => {
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      locationName: defaultValues?.name || "",
      description: defaultValues?.description || "",
    //   createdOn: "",
    //   createdBy: "",
    //   modifiedOn: "",
    //   modifiedBy: "",
    }
  });

  const { t } = useTranslation();

  useEffect(() => {
    // const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
    // const currentUser = "current.loggedin@user"; // Replace with actual user info from context/store
    // setValue("createdOn", now);
    // setValue("createdBy", currentUser);
    // setValue("modifiedOn", now);
    // setValue("modifiedBy", currentUser);
  }, [setValue]);

  const onSubmit = async (data: any) => {
    console.log("Submit Location:", data);
    // API call here
    onClose();
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">{t("createLocation")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t("locationName")}</Label>
            <Input
              {...register("locationName", { required: true, maxLength: 40 })}
              placeholder="Enter location/group name"
            />
          </div>

          <div>
            <Label>{t("description")}</Label>
            <Input
              {...register("description", { maxLength: 100 })}
              placeholder="Enter description"
            />
          </div>

          {/* <div>
            <Label>{t("createdOn")}</Label>
            <Input {...register("createdOn")} disabled />
          </div>
          <div>
            <Label>{t("createdBy")}</Label>
            <Input {...register("createdBy")} disabled />
          </div>
          <div>
            <Label>{t("modifiedOn")}</Label>
            <Input {...register("modifiedOn")} disabled />
          </div>
          <div>
            <Label>{t("modifiedBy")}</Label>
            <Input {...register("modifiedBy")} disabled />
          </div> */}
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
