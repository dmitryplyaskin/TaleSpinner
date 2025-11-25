import { DbService } from "@core/services/db.service";
import {
  AnalysisAgent,
  BaseAgent,
  FactionsAgent,
  LocationsAgent,
  RacesAgent,
  HistoryAgent,
  MagicAgent,
} from "./agents";
import { v4 as uuidv4 } from "uuid";
import {
  AgentAnalysisSchema,
  WorldDataSchema,
  GenerationProgress,
  WorldData,
} from "../../schemas/world";
import { ApiSettingsService } from "@services/api-settings.service";
import { LLMOutputLanguage } from "@shared/types/settings";

type AgentName = keyof GenerationProgress;

const DEFAULT_PROGRESS: GenerationProgress = {
  base: "pending",
  factions: "pending",
  locations: "pending",
  races: "pending",
  history: "pending",
  magic: "pending",
};

export class AgentWorldService {
  private db = DbService.getInstance().getClient();
  private analysisAgent = new AnalysisAgent();
  private baseAgent = new BaseAgent();
  private factionsAgent = new FactionsAgent();
  private locationsAgent = new LocationsAgent();
  private racesAgent = new RacesAgent();
  private historyAgent = new HistoryAgent();
  private magicAgent = new MagicAgent();

  private async getOutputLanguage(): Promise<LLMOutputLanguage> {
    const settings = await ApiSettingsService.getSettings();
    return settings?.llmOutputLanguage || "ru";
  }

  private async updateProgress(
    sessionId: string,
    agentName: AgentName,
    status: GenerationProgress[AgentName]
  ): Promise<void> {
    const result = await this.db.query(
      `SELECT generation_progress FROM world_generation_sessions WHERE id = $1`,
      [sessionId]
    );
    const row = result.rows[0] as
      | { generation_progress?: GenerationProgress | string }
      | undefined;
    let currentProgress: GenerationProgress;

    if (row?.generation_progress) {
      currentProgress =
        typeof row.generation_progress === "string"
          ? JSON.parse(row.generation_progress)
          : row.generation_progress;
    } else {
      currentProgress = { ...DEFAULT_PROGRESS };
    }

    currentProgress[agentName] = status;

    await this.db.query(
      `UPDATE world_generation_sessions SET generation_progress = $1 WHERE id = $2`,
      [JSON.stringify(currentProgress), sessionId]
    );
  }

  private async generateWithRetry<T>(
    agent: () => Promise<T>,
    maxRetries: number = 2
  ): Promise<T> {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await agent();
      } catch (error) {
        if (i === maxRetries) throw error;
        console.warn(`Retry ${i + 1}/${maxRetries}...`);
      }
    }
    throw new Error("Unreachable");
  }

  async startSession(setting: string) {
    try {
      const id = uuidv4();
      await this.db.query(
        `INSERT INTO world_generation_sessions (id, status, setting, collected_info, generation_progress) VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          "collecting_info",
          setting,
          JSON.stringify([]),
          JSON.stringify(DEFAULT_PROGRESS),
        ]
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
      const session = sessionResult.rows[0] as {
        collected_info: string | string[];
        setting: string;
      };
      if (!session) {
        throw new Error("Session not found");
      }

      // Parse collected_info if it's a JSON string from the database
      const currentKnownInfo: string[] =
        typeof session.collected_info === "string"
          ? JSON.parse(session.collected_info)
          : session.collected_info || [];
      const outputLanguage = await this.getOutputLanguage();

      // Run analysis
      const analysisResult = await this.analysisAgent.analyze(
        userInput,
        currentKnownInfo,
        session.setting,
        outputLanguage
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

  async generateWorld(sessionId: string): Promise<WorldData> {
    try {
      const sessionResult = await this.db.query(
        `SELECT * FROM world_generation_sessions WHERE id = $1`,
        [sessionId]
      );
      const session = sessionResult.rows[0] as {
        collected_info: string | string[];
        setting: string;
      };
      if (!session) {
        throw new Error("Session not found");
      }

      // Parse collected_info if it's a JSON string from the database
      const collectedInfo: string[] =
        typeof session.collected_info === "string"
          ? JSON.parse(session.collected_info)
          : session.collected_info || [];

      const outputLanguage = await this.getOutputLanguage();

      // Update status to generating
      await this.db.query(
        `UPDATE world_generation_sessions SET status = 'generating' WHERE id = $1`,
        [sessionId]
      );

      // Stage 1: Generate base world
      await this.updateProgress(sessionId, "base", "in_progress");
      let baseWorld;
      try {
        baseWorld = await this.generateWithRetry(() =>
          this.baseAgent.generate(
            collectedInfo,
            session.setting,
            outputLanguage
          )
        );
        await this.updateProgress(sessionId, "base", "completed");
      } catch (error) {
        await this.updateProgress(sessionId, "base", "failed");
        throw error;
      }

      // Stage 2: Parallel generation of details
      const agentTasks: Array<{
        name: AgentName;
        task: () => Promise<unknown>;
      }> = [
        {
          name: "factions",
          task: () =>
            this.factionsAgent.generate(
              baseWorld,
              collectedInfo,
              outputLanguage
            ),
        },
        {
          name: "locations",
          task: () =>
            this.locationsAgent.generate(
              baseWorld,
              collectedInfo,
              outputLanguage
            ),
        },
        {
          name: "races",
          task: () =>
            this.racesAgent.generate(baseWorld, collectedInfo, outputLanguage),
        },
        {
          name: "history",
          task: () =>
            this.historyAgent.generate(
              baseWorld,
              collectedInfo,
              outputLanguage
            ),
        },
        {
          name: "magic",
          task: () =>
            this.magicAgent.generate(baseWorld, collectedInfo, outputLanguage),
        },
      ];

      // Mark all as in_progress
      await Promise.all(
        agentTasks.map((agent) =>
          this.updateProgress(sessionId, agent.name, "in_progress")
        )
      );

      // Run all agents in parallel with retry and progress tracking
      const results = await Promise.all(
        agentTasks.map(async (agent) => {
          try {
            const result = await this.generateWithRetry(agent.task);
            await this.updateProgress(sessionId, agent.name, "completed");
            return { name: agent.name, result, success: true };
          } catch (error) {
            await this.updateProgress(sessionId, agent.name, "failed");
            console.error(`Agent ${agent.name} failed:`, error);
            return { name: agent.name, result: null, success: false };
          }
        })
      );

      // Check if any critical agents failed
      const failedAgents = results.filter((r) => !r.success);
      if (failedAgents.length > 0) {
        throw new Error(
          `Failed to generate: ${failedAgents.map((a) => a.name).join(", ")}`
        );
      }

      // Extract results
      const factionsResult = results.find((r) => r.name === "factions")
        ?.result as {
        factions: WorldData["factions"];
      };
      const locationsResult = results.find((r) => r.name === "locations")
        ?.result as {
        locations: WorldData["locations"];
      };
      const racesResult = results.find((r) => r.name === "races")?.result as {
        races: WorldData["races"];
      };
      const historyResult = results.find((r) => r.name === "history")
        ?.result as {
        history: WorldData["history"];
      };
      const magicResult = results.find((r) => r.name === "magic")?.result as {
        magic: WorldData["magic"];
      };

      // Stage 3: Merge and validate
      const worldData: WorldData = {
        ...baseWorld,
        factions: factionsResult?.factions,
        locations: locationsResult?.locations,
        races: racesResult?.races,
        history: historyResult?.history,
        magic: magicResult?.magic,
      };

      const validated = WorldDataSchema.parse(worldData);

      await this.db.query(
        `UPDATE world_generation_sessions SET generated_world = $1, status = 'review' WHERE id = $2`,
        [JSON.stringify(validated), sessionId]
      );

      return validated;
    } catch (error) {
      console.error("Failed to generate world:", error);
      throw new Error("Failed to generate world data");
    }
  }

  async getGenerationProgress(sessionId: string): Promise<GenerationProgress> {
    const result = await this.db.query(
      `SELECT generation_progress, status FROM world_generation_sessions WHERE id = $1`,
      [sessionId]
    );

    const row = result.rows[0] as
      | { generation_progress?: GenerationProgress | string; status?: string }
      | undefined;
    if (!row) {
      throw new Error("Session not found");
    }

    const progress = row.generation_progress;
    if (typeof progress === "string") {
      return JSON.parse(progress);
    }
    return progress || { ...DEFAULT_PROGRESS };
  }

  async submitAnswers(sessionId: string, answers: Record<string, string>) {
    try {
      const sessionResult = await this.db.query(
        `SELECT * FROM world_generation_sessions WHERE id = $1`,
        [sessionId]
      );
      const session = sessionResult.rows[0] as {
        collected_info: string | string[];
      };
      if (!session) {
        throw new Error("Session not found");
      }

      // Parse collected_info if it's a JSON string from the database
      const currentKnownInfo: string[] =
        typeof session.collected_info === "string"
          ? JSON.parse(session.collected_info)
          : session.collected_info || [];
      const newFacts: string[] = [];

      // Process answers and filter out empty/"decide yourself" responses
      for (const [, answer] of Object.entries(answers)) {
        const trimmed = answer.trim().toLowerCase();

        // Skip empty answers or "decide yourself" variations
        if (
          !trimmed ||
          trimmed === "решай сам" ||
          trimmed === "придумай сам" ||
          trimmed === "не знаю" ||
          trimmed === "decide yourself" ||
          trimmed === "skip"
        ) {
          continue;
        }

        // Add the answer to new facts
        newFacts.push(answer.trim());
      }

      // Update collected_info with new facts
      const updatedInfo = [...currentKnownInfo, ...newFacts];
      await this.db.query(
        `UPDATE world_generation_sessions SET collected_info = $1 WHERE id = $2`,
        [JSON.stringify(updatedInfo), sessionId]
      );

      // Generate world with collected information (including partial answers)
      return await this.generateWorld(sessionId);
    } catch (error) {
      console.error("Failed to submit answers:", error);
      throw new Error("Failed to process answers and generate world");
    }
  }

  async saveWorld(sessionId: string, worldData: WorldData) {
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
