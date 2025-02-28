import mongoose from 'mongoose';
import { userSchema } from '@/lib/models/user.model';

let authConnection: mongoose.Connection | null = null;

export const connectToAuthDB = async () => {
  try {
    if (!process.env.MONGODB_AUTH_URI) {
      throw new Error('MONGODB_AUTH_URI is not defined in the environment variables');
    }

    if (authConnection) {
      return authConnection;
    }

    const conn = await mongoose.createConnection(process.env.MONGODB_AUTH_URI).asPromise();
    authConnection = conn;
    
    // Initialize models on this connection
    if (!conn.models.User) {
      conn.model('User', userSchema);
    }
    
    console.log('MongoDB Auth connected');
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB Auth:', error);
    throw error;
  }
}; 