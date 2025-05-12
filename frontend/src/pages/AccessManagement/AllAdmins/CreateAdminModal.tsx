import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAdminSchema } from "@/lib/schema";
import Label from "../../../components/common/form/Label";
import Input from "../../../components/common/form/input/InputField";
import MultiSelect from "../../../components/common/form/MultiSelect";
import Button from "../../../components/ui/button/Button";
import { z } from "zod";

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

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Create New Admin</h2>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <Label htmlFor="adminName">Admin Name</Label>
          <Input
            id="adminName"
            {...register("name")}
            error={!!errors.name}
            hint={errors.name?.message}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="password">Password</Label>
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
          <Label htmlFor="confirmPassword">Confirm Password</Label>
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
          <Label htmlFor="assignRole">Assign Roles</Label>
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
            Cancel
          </Button>
          <Button type="submit">{!activeUser ? "Create" : "Update"}</Button>
        </div>
      </form>
    </div>
  );
};

export default CreateAdminModal;
