import { Types } from 'mongoose';
import { DocumentStatus } from '../../types/enums';

export interface Document {
  _id?: Types.ObjectId;
  templateId: Types.ObjectId;
  fileId: Types.ObjectId;
  creatorAccountId: Types.ObjectId;
  assignedAccountId?: Types.ObjectId;
  title: string;
  note?: string;
  status: DocumentStatus;
  archived?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} 