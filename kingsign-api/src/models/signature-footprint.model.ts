// signature-footprint-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export default function (app: Application): Model<any> {
  const modelName = 'signatureFootprint';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  
  const schema = new Schema({
    // Reference to the document
    documentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'documents',
      required: true 
    },
    
    // Reference to the contact/signer
    contactId: { 
      type: Schema.Types.ObjectId, 
      ref: 'contacts',
      required: true 
    },
    
    // IP Address information (from req.ip or req.connection.remoteAddress)
    ipAddress: { 
      type: String, 
      required: true 
    },
    
    // Forwarded IP (from X-Forwarded-For header)
    forwardedIp: { 
      type: String 
    },
    
    // Real IP (from X-Real-IP header)
    realIp: { 
      type: String 
    },
    
    // Browser and device information (from User-Agent header)
    userAgent: { 
      type: String, 
      required: true 
    },
    
    // HTTP Headers for audit trail
    requestHeaders: {
      referer: { type: String },          // req.headers['referer']
      origin: { type: String },           // req.headers['origin']
      acceptLanguage: { type: String },  // req.headers['accept-language']
      acceptEncoding: { type: String },  // req.headers['accept-encoding']
      accept: { type: String },           // req.headers['accept']
      host: { type: String },             // req.headers['host']
      connection: { type: String },       // req.headers['connection']
      cacheControl: { type: String },    // req.headers['cache-control']
    },

    // Request method and URL
    requestInfo: {
      method: { type: String },           // req.method
      url: { type: String },              // req.url
      protocol: { type: String },         // req.protocol
      secure: { type: Boolean }           // req.secure
    },
  }, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    (mongooseClient as any).deleteModel(modelName);
  }
  
  return mongooseClient.model<any>(modelName, schema);
}
