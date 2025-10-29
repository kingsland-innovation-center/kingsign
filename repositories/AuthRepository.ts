import client from "@/services/FeathersClient";
import { getSession } from "next-auth/react";
import { AuthenticationResult } from "@feathersjs/authentication";

interface AuthResponse extends AuthenticationResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    [key: string]: unknown;
  };
}

export class AuthRepository {
  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await client.authenticate({
      strategy: "local",
      email,
      password,
    });
    return response as AuthResponse;
  }

  static async logout(): Promise<void> {
    await client.logout();
  }

  static async reauthenticate(): Promise<void> {
    let token = window.localStorage.getItem("feathers-jwt");
    
    if (!client?.authentication?.authenticated) {
      if (!token) {
        const session = await getSession();
        token = session?.user?.accessToken as string;

        if (token) {
          window.localStorage.setItem("feathers-jwt", token);
        }
      }

      if (token) {
        await client.authentication.setAccessToken(token);
        await client.authentication.reAuthenticate();
      }
    }
  }

  static async getJWT(): Promise<string | null> {
    return window.localStorage.getItem("feathers-jwt");
  }

  static async setJWT(token: string): Promise<void> {
    window.localStorage.setItem("feathers-jwt", token);
  }

  static async removeJWT(): Promise<void> {
    window.localStorage.removeItem("feathers-jwt");
  }
}