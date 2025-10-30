import { Types } from 'mongoose';

export interface DocumentField {
  _id?: Types.ObjectId;
  documentId: Types.ObjectId;
  fieldId: Types.ObjectId;
  value: any;
  fileId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
} 