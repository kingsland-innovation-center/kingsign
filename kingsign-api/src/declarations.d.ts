import { Application as ExpressFeathers } from '@feathersjs/express';
import { Application as FeathersApplication } from '@feathersjs/feathers';
import { Application as SocketIOApplication } from '@feathersjs/socketio';
import { ObjectId } from 'mongoose';

// User interface based on the user model
export interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string | null;
  resetPasswordToken?: string | null;
  confirmationToken?: string | null;
  currentWorkspaceId?: ObjectId | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// A mapping of service names to types. Will be extended in service files.
export interface ServiceTypes {}
// The application instance type that will be used everywhere else
export type Application = ExpressFeathers<ServiceTypes> & SocketIOApplication<ServiceTypes> & FeathersApplication<ServiceTypes>;
