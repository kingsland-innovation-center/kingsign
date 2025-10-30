// document-fields-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';
import { FieldType } from '../types/enums';

export default function (app: Application): Model<any> {
  const modelName = 'documentFields';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    documentId: { type: Schema.Types.ObjectId, ref: 'documents', required: true },
    fieldId: { type: Schema.Types.ObjectId, ref: 'templateFields', required: true },
    value: { type: Schema.Types.Mixed },
    fileId: { type: Schema.Types.ObjectId, ref: 'files' },
    contactId: { type: Schema.Types.ObjectId, ref: 'contacts' },
    isSigned: { type: Boolean, default: false },
  }, {
    timestamps: true
  });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    (mongooseClient as any).deleteModel(modelName);
  }
  return mongooseClient.model<any>(modelName, schema);
} 