"use client";

import Link from "next/link";
import { SubmitHandler, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appPath } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { CreateMasterAccountParams } from "@/repositories/MasterAccountRepository";

export function RegisterForm() {
  const { createMasterAccount } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMasterAccountParams>();
  const onSubmit: SubmitHandler<CreateMasterAccountParams> = (data) => {
    createMasterAccount(data);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="block text-sm mb-1" htmlFor="name">
          Name *
        </label>
        <Input
          id="name"
          type="text"
          {...register("name", { required: true })}
        />
        {errors.name && (
          <span className="text-red-500">This field is required</span>
        )}
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="email">
          Email *
        </label>
        <Input
          id="email"
          type="email"
          {...register("email", { required: true })}
        />
        {errors.email && (
          <span className="text-red-500">This field is required</span>
        )}
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="company">
          Company *
        </label>
        <Input
          id="company"
          type="text"
          {...register("company", { required: true })}
        />
        {errors.company && (
          <span className="text-red-500">This field is required</span>
        )}
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="password">
          Password *
        </label>
        <Input
          id="password"
          type="password"
          {...register("password", { required: true })}
        />
        {errors.password && (
          <span className="text-red-500">This field is required</span>
        )}
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <Button type="submit" className="flex-1">
          Create Account
        </Button>
        <Button type="button" variant="outline" className="flex-1" asChild>
          <Link href={appPath.auth.login}>Login</Link>
        </Button>
      </div>
    </form>
  );
}
