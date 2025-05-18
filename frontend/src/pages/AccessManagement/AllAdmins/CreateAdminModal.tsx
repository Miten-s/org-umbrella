import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAdminSchema } from "@/lib/schema";
import Label from "@/components/common/form/Label";
import Input from "@/components/common/form/input/InputField";
import MultiSelect from "@/components/common/form/MultiSelect";
import Button from "@/components/ui/button/Button";
import { z } from "zod";
import { useTranslation } from "react-i18next";

interface Option {
  value: string;
  text: string;
}

interface CreateAdminModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  roles: Option[];
  activeUser?: any;
}

const CreateAdminModal = ({
  onClose,
  onSubmit,
  roles,
  activeUser
}: CreateAdminModalProps) => {
  const adminSchema = getAdminSchema(!!activeUser);

  type CreateAdminForm = z.infer<typeof adminSchema>;
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CreateAdminForm>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      name: activeUser ? activeUser?.name : "",
      email: activeUser ? activeUser?.email : "",
      password: "",
      confirmPassword: "",
      assignRole: activeUser
        ? activeUser?.roles.map((role: { _id: string }) => role._id.toString())
        : []
    }
  });
  const { t } = useTranslation()
  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">{!activeUser ? t('createNewAdmin') : t('updateAdmin')}</h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <Label htmlFor="adminName">{t('adminName')}</Label>
          <Input
            id="adminName"
            {...register("name")}
            error={!!errors.name}
            hint={errors.name?.message}
          />
        </div>

        <div>
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            disabled={activeUser}
            error={!!errors.email}
            hint={errors.email?.message}
          />
        </div>

        <div>
          <Label htmlFor="password"> {t('password')}</Label>
          <Input
            id="password"
            type="password"
            disabled={activeUser}
            {...register("password")}
            error={!!errors.password}
            hint={errors.password?.message}
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            disabled={activeUser}
            {...register("confirmPassword")}
            error={!!errors.confirmPassword}
            hint={errors.confirmPassword?.message}
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="assignRole"> {t('assignRoles')} </Label>
          <MultiSelect
            label="Multiple Select Options"
            options={roles}
            defaultSelected={
              activeUser?.roles.map((role: { _id: string }) =>
                role._id.toString()
              ) ?? []
            }
            onChange={(selected) => setValue("assignRole", selected)}
          />
          {errors.assignRole && (
            <p className="text-xs text-error-500 mt-1">
              {errors.assignRole.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2 flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit">{!activeUser ? t('create', {entity: t('admin') }) :  t('updateAdmin')}</Button>
        </div>
      </form>
    </div>
  );
};

export default CreateAdminModal;
