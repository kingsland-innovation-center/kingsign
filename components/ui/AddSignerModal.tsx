import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IconX } from "@tabler/icons-react";
import { Button } from "./button";
import { Input } from "./input";

const signerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

type SignerFormData = z.infer<typeof signerSchema>;

interface AddSignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (signer: SignerFormData) => void;
}

export default function AddSignerModal({
  isOpen,
  onClose,
  onAdd,
}: AddSignerModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignerFormData>({
    resolver: zodResolver(signerSchema),
  });

  const onSubmit = (data: SignerFormData) => {
    onAdd(data);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white p-6 rounded-lg shadow-lg w-96">
        <Button
          onClick={onClose}
          className="absolute top-3 right-3"
          aria-label="Close"
          variant="ghost"
        >
          <IconX className="w-5 h-5" />
        </Button>

        <h2 className="text-lg font-semibold mb-4">Add Signer</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name *</label>
            <Input
              type="text"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Email *</label>
            <Input
              type="email"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
