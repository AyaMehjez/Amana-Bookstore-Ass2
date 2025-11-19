// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'AmanaBookstore';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

if (!uri) {
  throw new Error('Please add your MONGODB_URI to .env.local file');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri!);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri!);
  clientPromise = client.connect();
}

/**
 * Get MongoDB client instance
 */
export async function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    if (!uri) {
      throw new Error('MONGODB_URI is not set');
    }
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

/**
 * Get MongoDB database instance
 */
export async function getDatabase(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}

/**
 * Close MongoDB connection
 */
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    clientPromise = null;
  }
}

