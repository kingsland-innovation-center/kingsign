import client from "@/services/FeathersClient";

export interface MasterAccount {
  id: string;
  name: string;
  email: string;
  company: string;
  [key: string]: unknown;
}

export interface CreateMasterAccountParams {
  name: string;
  email: string;
  password: string;
  company: string;
}

export class MasterAccountRepository {
  private static serviceName = "master-account";

  static async create(data: CreateMasterAccountParams): Promise<MasterAccount> {
    return await client.service(this.serviceName).create(data);
  }
} 