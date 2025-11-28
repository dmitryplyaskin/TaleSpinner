import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import path from "path";

export class DbService {
  private static instance: DbService;
  private db: PGlite;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    const dataDir = path.resolve("./data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.db = new PGlite("./data/db");
  }

  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }
    return DbService.instance;
  }

  public getClient(): PGlite {
    return this.db;
  }

  public async init() {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initializeDatabase();
    return this.initPromise;
  }

  private async initializeDatabase() {
    console.log("Initializing database...");

    try {
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS world_generation_sessions (
          id TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          setting TEXT,
          user_input TEXT,
          collected_info JSONB DEFAULT '[]'::jsonb,
          generated_world JSONB,
          generation_progress JSONB DEFAULT '{"base":"pending","factions":"pending","locations":"pending","races":"pending","history":"pending","magic":"pending"}'::jsonb,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS worlds (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          genre TEXT,
          tone TEXT,
          description TEXT,
          is_favorite BOOLEAN DEFAULT FALSE,
          data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log("Database initialized successfully.");
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }
}
