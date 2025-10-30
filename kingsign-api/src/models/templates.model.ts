// templates-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export default function (app: Application): Model<any> {
  const modelName = 'templates';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    fileId: { type: Schema.Types.ObjectId, ref: 'files', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    archived: { type: Boolean, default: false },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'workspaces', required: true },
    tagIds: [{ type: Schema.Types.ObjectId, ref: 'tags' }],
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
