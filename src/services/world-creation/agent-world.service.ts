import { DbService } from "@core/services/db.service";
import { AnalysisAgent } from "./agents/analysis.agent";
import { GenerationAgent } from "./agents/generation.agent";
import { v4 as uuidv4 } from "uuid";
import { AgentAnalysisSchema, WorldDataSchema } from "../../schemas/world";

export class AgentWorldService {
  private db = DbService.getInstance().getClient();
  private analysisAgent = new AnalysisAgent();
  private generationAgent = new GenerationAgent();

  async startSession(setting: string) {
    try {
      const id = uuidv4();
      await this.db.query(
        `INSERT INTO world_generation_sessions (id, status, setting, collected_info) VALUES ($1, $2, $3, $4)`,
        [id, "collecting_info", setting, JSON.stringify([])]
      );
      return { sessionId: id };
    } catch (error) {
      console.error("Failed to start session:", error);
      throw new Error("Failed to create world generation session");
    }
  }

  async analyzeInput(sessionId: string, userInput: string) {
    try {
      const sessionResult = await this.db.query(
        `SELECT * FROM world_generation_sessions WHERE id = $1`,
        [sessionId]
      );
      const session = sessionResult.rows[0] as any;
      if (!session) {
        throw new Error("Session not found");
      }

      const currentKnownInfo = session.collected_info || [];
      
      // Run analysis
      const analysisResult = await this.analysisAgent.analyze(
        userInput,
        currentKnownInfo,
        session.setting
      );

      // Validate the analysis result with Zod
      const analysis = AgentAnalysisSchema.parse(analysisResult);

      // Update session with new knowledge
      const updatedKnownInfo = [...currentKnownInfo, ...analysis.known_info];

      await this.db.query(
        `UPDATE world_generation_sessions SET collected_info = $1, user_input = $2 WHERE id = $3`,
        [JSON.stringify(updatedKnownInfo), userInput, sessionId]
      );

      return analysis;
    } catch (error) {
      console.error("Failed to analyze input:", error);
      throw new Error("Failed to analyze user input");
    }
  }

  async generateWorld(sessionId: string) {
    try {
      const sessionResult = await this.db.query(
        `SELECT * FROM world_generation_sessions WHERE id = $1`,
        [sessionId]
      );
      const session = sessionResult.rows[0] as any;
      if (!session) {
        throw new Error("Session not found");
      }

      const generatedData = await this.generationAgent.generate(
        session.collected_info,
        session.setting
      );

      // Validate the generated world data with Zod
      const worldData = WorldDataSchema.parse(generatedData);

      await this.db.query(
        `UPDATE world_generation_sessions SET generated_world = $1, status = 'review' WHERE id = $2`,
        [JSON.stringify(worldData), sessionId]
      );

      return worldData;
    } catch (error) {
      console.error("Failed to generate world:", error);
      throw new Error("Failed to generate world data");
    }
  }

  async saveWorld(sessionId: string, worldData: any) {
    try {
      // Validate world data before saving
      const validatedData = WorldDataSchema.parse(worldData);
      
      // Final save to worlds table
      const id = uuidv4();
      await this.db.query(
        `INSERT INTO worlds (id, name, genre, tone, description, data) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          validatedData.name,
          validatedData.genre,
          validatedData.tone,
          validatedData.world_primer,
          JSON.stringify(validatedData),
        ]
      );
      
      await this.db.query(
        `UPDATE world_generation_sessions SET status = 'completed' WHERE id = $1`,
        [sessionId]
      );

      return { worldId: id };
    } catch (error) {
      console.error("Failed to save world:", error);
      throw new Error("Failed to save world to database");
    }
  }
}
