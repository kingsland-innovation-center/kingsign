"use client";
import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { signIn, signOut } from "next-auth/react";
import {
  useMutation,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { appPath } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AuthRepository } from "@/repositories/AuthRepository";
import { MasterAccountRepository, CreateMasterAccountParams } from "@/repositories/MasterAccountRepository";

export interface LoginParams {
  email: string;
  password: string;
}

type AuthContextType = {
  login: (params: LoginParams) => Promise<void>;
  createMasterAccount: (params: CreateMasterAccountParams) => Promise<void>;
  logout: () => Promise<void>;
  isRegisterLoading: boolean;
  isLoginLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    const reAuthenticate = async () => {
      try {
        await AuthRepository.reauthenticate();
      } catch (error) {
        console.error('Failed to reauthenticate:', error);
      }
    };
    
    reAuthenticate();
  }, []);

  const { mutateAsync: createMasterAccount, isLoading: isRegisterLoading } =
    useMutation({
      mutationFn: async (data: CreateMasterAccountParams) => {
        try {
          await MasterAccountRepository.create(data);
          toast.success("Registration successful");
          router.push(appPath.auth.signupSuccess);
        } catch (error) {
          toast.error((error as Error).message);
        }
      },
    });

  const { mutateAsync: login, isLoading: isLoginLoading } = useMutation({
    mutationFn: async (data: LoginParams) => {
      try {
        // First authenticate with Feathers
        const feathersResult = await AuthRepository.login(data.email, data.password);
        
        if (!feathersResult?.accessToken) {
          throw new Error("Failed to authenticate with Feathers");
        }

        // Then authenticate with NextAuth
        const nextAuthResult = await signIn("credentials", {
          redirect: false,
          email: data.email,
          password: data.password,
          callbackUrl: appPath.dashboard.root,
        });

        if (nextAuthResult?.ok) {
          toast.success("Login successful");
          router.replace(appPath.dashboard.root);
        } else {
          throw new Error(nextAuthResult?.error || "Failed to authenticate");
        }
      } catch (error) {
        toast.error((error as Error).message || "Login failed");
        throw error;
      }
    },
  });

  const { mutateAsync: logout } = useMutation({
    mutationFn: async () => {
      try {
        await AuthRepository.logout();
        await signOut({ redirect: false });
        toast.success("Logged out successfully");
        router.replace(appPath.auth.login);
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("Failed to logout");
      }
    },
  });

  return (
    <AuthContext.Provider
      value={{
        login,
        createMasterAccount,
        logout,
        isRegisterLoading,
        isLoginLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
