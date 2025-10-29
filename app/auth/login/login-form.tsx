"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";

import { appPath } from "@/lib/utils";
import { LoginParams, useAuth } from "@/providers/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginParams>();
  const { login, isLoginLoading } = useAuth();

  const onSubmit = (data: LoginParams) => {
    login(data);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="block text-sm mb-1" htmlFor="email">
          Email *
        </label>
        <Input
          id="email"
          type="email"
          {...register("email", { required: "Email is required" })}
        />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="password">
          Password *
        </label>
        <Input
          id="password"
          type="password"
          {...register("password", { required: "Password is required" })}
        />
        {errors.password && (
          <p className="text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="text-right">
        <Link
          href={appPath.auth.forgotPassword}
          className="text-sm text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <div className="flex flex-col gap-4 pt-4">
        <Button type="submit" className="flex-1" disabled={isLoginLoading}>
          {isLoginLoading ? "Logging in..." : "Login"}
        </Button>
        <Button onClick={() => router.push(appPath.auth.register)} type="button" variant="outline" className="flex-1">
          Create account
        </Button>
      </div>
    </form>
  );
}
