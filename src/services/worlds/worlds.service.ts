import { DbService } from "@core/services/db.service";
import { WorldData } from "../../schemas/world";

export interface SavedWorld {
  id: string;
  name: string;
  genre: string;
  tone: string;
  description: string;
  is_favorite: boolean;
  data: WorldData;
  created_at: string;
  updated_at: string;
}

interface WorldRow {
  id: string;
  name: string;
  genre: string;
  tone: string;
  description: string;
  is_favorite: boolean;
  data: WorldData | string;
  created_at: Date;
  updated_at: Date;
}

export class WorldsService {
  private db = DbService.getInstance().getClient();

  async getAllWorlds(): Promise<SavedWorld[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM worlds ORDER BY created_at DESC`
      );

      return result.rows.map((row) => this.mapRowToWorld(row as WorldRow));
    } catch (error) {
      console.error("Failed to get worlds:", error);
      throw new Error("Failed to get worlds from database");
    }
  }

  async getWorldById(id: string): Promise<SavedWorld | null> {
    try {
      const result = await this.db.query(`SELECT * FROM worlds WHERE id = $1`, [
        id,
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToWorld(result.rows[0] as WorldRow);
    } catch (error) {
      console.error("Failed to get world:", error);
      throw new Error("Failed to get world from database");
    }
  }

  async deleteWorld(id: string): Promise<boolean> {
    try {
      // First check if world exists
      const checkResult = await this.db.query(
        `SELECT id FROM worlds WHERE id = $1`,
        [id]
      );
      if (checkResult.rows.length === 0) {
        return false;
      }
      
      await this.db.query(`DELETE FROM worlds WHERE id = $1`, [id]);
      return true;
    } catch (error) {
      console.error("Failed to delete world:", error);
      throw new Error("Failed to delete world from database");
    }
  }

  async toggleFavorite(id: string): Promise<SavedWorld | null> {
    try {
      const result = await this.db.query(
        `UPDATE worlds SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToWorld(result.rows[0] as WorldRow);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      throw new Error("Failed to toggle favorite status");
    }
  }

  private mapRowToWorld(row: WorldRow): SavedWorld {
    return {
      id: row.id,
      name: row.name,
      genre: row.genre,
      tone: row.tone,
      description: row.description,
      is_favorite: row.is_favorite,
      data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}

