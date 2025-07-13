import mongoose from 'mongoose';
import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mangareader';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment değişkeni tanımlanmalı');
}

interface MongooseConnection {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

interface MongoConnection {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

declare global {
  var mongoose: MongooseConnection | undefined;
  var mongodb: MongoConnection | undefined;
  var modelsInitialized: boolean | undefined;
}

let cached = global.mongoose;
let mongoCached = global.mongodb;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

if (!mongoCached) {
  mongoCached = global.mongodb = { client: null, db: null, promise: null };
}

// Initialize models to prevent MissingSchemaError in serverless environment
function initializeModels() {
  if (global.modelsInitialized) {
    return;
  }

  try {
    // Import all models to ensure they are registered
    require('./models/User');
    require('./models/Manga');
    require('./models/Chapter');
    require('./models/Comment');
    require('./models/Reaction');
    require('./models/Session');
    
    global.modelsInitialized = true;
    console.log('✅ All models initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing models:', error);
  }
}

async function connectDB(): Promise<mongoose.Connection> {
  if (cached!.conn) {
    // Initialize models even if connection exists
    initializeModels();
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB bağlantısı başarılı');
      // Initialize models after successful connection
      initializeModels();
      return mongoose.connection;
    }).catch((error) => {
      console.error('❌ MongoDB bağlantı hatası:', error);
      throw error;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

async function connectMongoDB(): Promise<{ client: MongoClient; db: Db }> {
  if (mongoCached!.client && mongoCached!.db) {
    return { client: mongoCached!.client, db: mongoCached!.db };
  }

  if (!mongoCached!.promise) {
    mongoCached!.promise = MongoClient.connect(MONGODB_URI).then((client) => {
      console.log('✅ MongoDB Native bağlantısı başarılı');
      const db = client.db(); // Default database kullan
      return { client, db };
    }).catch((error) => {
      console.error('❌ MongoDB Native bağlantı hatası:', error);
      throw error;
    });
  }

  try {
    const { client, db } = await mongoCached!.promise;
    mongoCached!.client = client;
    mongoCached!.db = db;
    return { client, db };
  } catch (e) {
    mongoCached!.promise = null;
    throw e;
  }
}

export default connectDB;
export { connectDB as connectToDatabase };
export { connectMongoDB };

// DB instance'ını export et
export const getDB = async (): Promise<Db> => {
  const { db } = await connectMongoDB();
  return db;
};

// Compatibility için
export const db = {
  collection: async (name: string) => {
    const database = await getDB();
    return database.collection(name);
  }
};