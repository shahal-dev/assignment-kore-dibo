import { config } from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from "ws";
import * as schema from "@shared/schema";

config();

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

export class DatabaseStorage {
  private db: ReturnType<typeof drizzle>;

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
  }

  public async initializeDatabase() {
    try {
      // Run migrations
      await migrate(this.db, { migrationsFolder: './drizzle' });
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Failed to run migrations:', error);
      throw error;
    }
  }
}

const databaseStorage = new DatabaseStorage(db);
databaseStorage.initializeDatabase();