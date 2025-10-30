// notification-integrations-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export enum NotificationType {
  DOCUMENT_COMPLETED = 'document.completed',
  DOCUMENT_UPDATED = 'document.updated'
}

export default function (app: Application): Model<any> {
  const modelName = 'notificationIntegrations';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    name: { type: String, required: true },
    url: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'URL must be a valid HTTP/HTTPS URL'
      }
    },
    notificationType: { 
      type: String, 
      required: true, 
      enum: Object.values(NotificationType)
    },
    isEnabled: { type: Boolean, default: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'workspaces', required: true },
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
