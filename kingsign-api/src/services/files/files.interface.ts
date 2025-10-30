import { Types } from 'mongoose';

export interface Files {
  _id?: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileExtension: string;
  workspaceId: Types.ObjectId;
  accountId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
} 