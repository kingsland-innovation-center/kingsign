import client from "@/services/FeathersClient";
import { Query } from "@feathersjs/feathers";

export interface SignatureFootprint {
  _id: string;
  documentId: string;
  contactId: string;
  ipAddress: string;
  forwardedIp?: string;
  realIp?: string;
  userAgent: string;
  requestHeaders: {
    referer?: string;
    origin?: string;
    acceptLanguage?: string;
    acceptEncoding?: string;
    accept?: string;
    host?: string;
    connection?: string;
    cacheControl?: string;
  };
  requestInfo: {
    method: string;
    url: string;
    protocol: string;
    secure: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SignatureFootprintData {
  documentId: string;
  contactId: string;
  ipAddress: string;
  forwardedIp?: string;
  realIp?: string;
  userAgent: string;
  requestHeaders: {
    referer?: string;
    origin?: string;
    acceptLanguage?: string;
    acceptEncoding?: string;
    accept?: string;
    host?: string;
    connection?: string;
    cacheControl?: string;
  };
  requestInfo: {
    method: string;
    url: string;
    protocol: string;
    secure: boolean;
  };
}

export interface SignatureFootprintPatch {
  documentId?: string;
  contactId?: string;
  ipAddress?: string;
  forwardedIp?: string;
  realIp?: string;
  userAgent?: string;
  requestHeaders?: {
    referer?: string;
    origin?: string;
    acceptLanguage?: string;
    acceptEncoding?: string;
    accept?: string;
    host?: string;
    connection?: string;
    cacheControl?: string;
  };
  requestInfo?: {
    method?: string;
    url?: string;
    protocol?: string;
    secure?: boolean;
  };
}

class SignatureFootprintRepository {
  private service = client.service("signature-footprints");

  async find(query: Query) {
    return this.service.find(query);
  }

  async get(id: string) {
    return this.service.get(id);
  }

  async create(data: SignatureFootprintData) {
    return this.service.create(data);
  }

  async patch(id: string, data: SignatureFootprintPatch) {
    return this.service.patch(id, data);
  }

  async remove(id: string) {
    return this.service.remove(id);
  }
}

export const signatureFootprintRepository = new SignatureFootprintRepository(); 