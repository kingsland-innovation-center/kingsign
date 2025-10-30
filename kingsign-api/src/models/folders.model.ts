// folders-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export enum FolderFilterType {
  DOCUMENTS = 'documents',
  TEMPLATES = 'templates'
}

export default function (app: Application): Model<any> {
  const modelName = 'folders';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    tagIds: [{ type: Schema.Types.ObjectId, ref: 'tags', required: true }],
    filterType: { 
      type: String, 
      required: true, 
      enum: Object.values(FolderFilterType),
      default: FolderFilterType.DOCUMENTS
    },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'workspaces', required: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'accounts', required: true },
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
