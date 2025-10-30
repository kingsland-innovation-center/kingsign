// documents-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';
import { DocumentStatus } from '../types/enums';

export default function (app: Application): Model<any> {
  const modelName = 'documents';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    templateId: { type: Schema.Types.ObjectId, ref: 'templates'},
    fileId: { type: Schema.Types.ObjectId, ref: 'files' },
    creatorAccountId: { type: Schema.Types.ObjectId, ref: 'accounts' },
    assignedAccountId: { type: Schema.Types.ObjectId, ref: 'accounts' },
    title: { type: String, required: true },
    note: { type: String },
    status: {
      type: String,
      required: true,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.PENDING
    },
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
