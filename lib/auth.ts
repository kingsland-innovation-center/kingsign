import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axiosClient from "@/services/Axios";
import { appPath } from "@/lib/utils";

export interface AuthUser {
  _id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
  resetPasswordToken: string | null;
  confirmationToken: string | null;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  accessToken: string;
  __v: number;
}

declare module "next-auth" {
  interface Session {
    user: AuthUser;
    accessToken: string;
    expires: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: AuthUser;
    accessToken: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "johndoe@sample.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email) throw new Error("Email is required");
          if (!credentials?.password) throw new Error("Password is required");

          const result = await axiosClient.post("/authentication", {
            strategy: "local",
            email: credentials.email,
            password: credentials.password,
          });

          if (!result.data.user.isVerified) {
            throw new Error(
              "Account is not verified yet. Please check you mail inbox."
            );
          }

          return {
            ...result.data.user,
            accessToken: result.data.accessToken,
          };
        } catch (error: unknown) {
          // Return the error message to the client
          if (error instanceof Error) {
            return Promise.reject(new Error(error.message || "Login failed"));
          }
          return Promise.reject(new Error("Login failed"));
        }
      },
      type: "credentials",
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const { accessToken, ...rest } = user as unknown as AuthUser;
        token.accessToken = accessToken;
        token.user = rest as unknown as AuthUser;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user = token.user;
      return session;
    },
  },
  pages: {
    signIn: appPath.auth.login,
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
};
