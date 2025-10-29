import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IconX } from "@tabler/icons-react";
import { Button } from "./button";
import { Input } from "./input";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { useEffect } from "react";

// Define permission enums
export enum Permission {
  CREATE = "canCreate",
  SIGN = "canSign",
  VIEW = "canView",
  EDIT = "canEdit",
  DELETE = "canDelete",
  MANAGE_USERS = "canManageUsers",
  ASSIGN_ROLES = "canAssignRoles"
}

// Human-readable labels for permissions
export const PermissionLabels: Record<Permission, string> = {
  [Permission.CREATE]: "Create Documents",
  [Permission.SIGN]: "Sign Documents",
  [Permission.VIEW]: "View Documents",
  [Permission.EDIT]: "Edit Documents",
  [Permission.DELETE]: "Delete Documents",
  [Permission.MANAGE_USERS]: "Manage Users",
  [Permission.ASSIGN_ROLES]: "Assign Roles"
};

const roleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isDefault: z.boolean(),
  [Permission.CREATE]: z.boolean(),
  [Permission.SIGN]: z.boolean(),
  [Permission.VIEW]: z.boolean(),
  [Permission.EDIT]: z.boolean(),
  [Permission.DELETE]: z.boolean(),
  [Permission.MANAGE_USERS]: z.boolean(),
  [Permission.ASSIGN_ROLES]: z.boolean(),
}).strict();

export type RoleFormData = z.infer<typeof roleSchema>;

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (role: RoleFormData) => void;
  onEdit?: (role: RoleFormData) => void;
  initialData?: RoleFormData;
  mode?: 'add' | 'edit';
}

export default function RoleFormModal({
  isOpen,
  onClose,
  onAdd,
  onEdit,
  initialData,
  mode = 'add',
}: AddRoleModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData || {
      name: "",
      isDefault: false,
      [Permission.CREATE]: false,
      [Permission.SIGN]: false,
      [Permission.VIEW]: true,
      [Permission.EDIT]: false,
      [Permission.DELETE]: false,
      [Permission.MANAGE_USERS]: false,
      [Permission.ASSIGN_ROLES]: false,
    }
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  // For debugging - watch form values
  const formValues = watch();
  console.log("Form values:", formValues);

  const onSubmit = (data: RoleFormData) => {
    // Ensure isDefault is always false for new roles
    const submissionData = {
      ...data,
      isDefault: initialData?.isDefault || false,
    };
    
    if (mode === 'edit' && onEdit) {
      onEdit(submissionData);
    } else {
      onAdd(submissionData);
    }
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[500px] max-h-[90vh] overflow-y-auto">
        <Button
          onClick={onClose}
          className="absolute top-3 right-3"
          aria-label="Close"
          variant="ghost"
        >
          <IconX className="w-5 h-5" />
        </Button>

        <h2 className="text-lg font-semibold mb-4">{mode === 'add' ? 'Add' : 'Edit'} Role</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              type="text"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
              placeholder="e.g. Manager, Viewer, etc."
              disabled={initialData?.isDefault}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(Permission).map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Controller
                    name={permission}
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id={permission}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={initialData?.isDefault}
                      />
                    )}
                  />
                  <Label htmlFor={permission} className="font-normal">
                    {PermissionLabels[permission]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={initialData?.isDefault}>
              {mode === 'add' ? 'Add' : 'Save'} Role
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 