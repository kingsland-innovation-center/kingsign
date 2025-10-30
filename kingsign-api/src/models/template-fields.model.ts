// template-fields-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';
import { FieldType } from '../types/enums';

export default function (app: Application): Model<any> {
  const modelName = 'templateFields';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    templateId: { type: Schema.Types.ObjectId, ref: 'templates', required: true },
    fieldType: { 
      type: String, 
      required: true,
      enum: Object.values(FieldType)
    },
    fieldName: { type: String, required: true },
    placeholder: { type: String, required: true },
    xPosition: { type: Number, required: true },
    yPosition: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    required: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
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
