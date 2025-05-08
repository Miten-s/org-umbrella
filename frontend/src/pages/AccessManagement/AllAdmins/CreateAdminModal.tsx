import { useForm } from 'react-hook-form';
import Label from '../../../components/common/form/Label';
import Input from '../../../components/common/form/input/InputField';
import MultiSelect from '../../../components/common/form/MultiSelect';
import Button from '../../../components/ui/button/Button';


interface Option {
    value: string;
    text: string;
}

interface CreateAdminModalProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
    roles: Option[];
    currentUser: string; 
}

const CreateAdminModal = ({ onClose, onSubmit, roles, currentUser }: CreateAdminModalProps) => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        setValue,
    } = useForm();

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Role</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="adminName">Admin Name</Label>
                    <Input id="adminName" {...register('name', { required: true })} />
                </div>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email', { required: true })} />
                </div>

                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" {...register('password', { required: true })} />
                </div>

                <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        {...register('confirmPassword', {
                            required: true,
                            validate: (val) => val === watch('password') || 'Passwords do not match',
                        })}
                    />
                </div>

                <div className="md:col-span-2">
                    <Label htmlFor="assignRole">Assign Roles</Label>
                    <MultiSelect
                        label="Multiple Select Options"
                        options={roles}
                        onChange={(selected) => setValue('assignRole', selected)}
                    />
                </div>

                <div>
                    <Label htmlFor="adminUser">Admin User</Label>
                    <Input id="adminUser" value={currentUser} disabled />
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Create</Button>
                </div>
            </form>

        </div>
    );
};

export default CreateAdminModal;
