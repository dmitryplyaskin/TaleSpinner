import { DbService } from "@core/services/db.service";
import { MemorySaver, Command } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import {
  AgentAnalysisSchema,
  WorldDataSchema,
  GenerationProgress,
  WorldData,
} from "../../schemas/world";
import { ApiSettingsService } from "@services/api-settings.service";
import { LLMOutputLanguage } from "@shared/types/settings";
import { getWorldGenerationGraph } from "./graph/world-generation.graph";
import type { WorldGenerationStateType } from "./graph/state";
import type {
  ClarificationRequest,
  ClarificationResponse,
} from "@shared/types/human-in-the-loop";
import { AnalysisAgent } from "./agents/analysis.agent";

type AgentName = keyof GenerationProgress;

const DEFAULT_PROGRESS: GenerationProgress = {
  base: "pending",
  factions: "pending",
  locations: "pending",
  races: "pending",
  history: "pending",
  magic: "pending",
};

// Checkpointer для сохранения состояния графа между вызовами
const checkpointer = new MemorySaver();

// Интерфейс для результата генерации
interface GenerationResult {
  status: "completed" | "waiting_for_input" | "error";
  world?: WorldData;
  clarification?: ClarificationRequest;
  error?: string;
}

// Интерфейс для событий streaming
interface StreamEvent {
  node: string;
  status: "started" | "completed" | "error" | "waiting_for_input";
  data?: Partial<WorldGenerationStateType>;
  clarification?: ClarificationRequest;
}

// Тип для входных данных графа
interface GraphInput {
  sessionId: string;
  setting: string;
  collectedInfo: string[];
  outputLanguage: LLMOutputLanguage;
}

export class AgentWorldService {
  private db = DbService.getInstance().getClient();
  private analysisAgent = new AnalysisAgent();

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

      const currentKnownInfo: string[] =
        typeof session.collected_info === "string"
          ? JSON.parse(session.collected_info)
          : session.collected_info || [];
      const outputLanguage = await this.getOutputLanguage();

      const analysisResult = await this.analysisAgent.analyze(
        userInput,
        currentKnownInfo,
        session.setting,
        outputLanguage
      );

      const analysis = AgentAnalysisSchema.parse(analysisResult);

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

  /**
   * Запуск генерации мира с поддержкой HITL
   */
  async startGeneration(
    sessionId: string,
    userInput?: string
  ): Promise<GenerationResult> {
    const session = await this.getSession(sessionId);
    const outputLanguage = await this.getOutputLanguage();

    // If userInput is provided, add it to collectedInfo if not already there
    let collectedInfo = session.collected_info;
    if (userInput) {
      // Update session with new input if needed
      // We assume input was not added via analyzeInput
      if (Array.isArray(collectedInfo)) {
        collectedInfo.push(userInput);
      } else {
        collectedInfo = [userInput];
      }

      // Save to DB
      await this.db.query(
        `UPDATE world_generation_sessions SET collected_info = $1 WHERE id = $2`,
        [JSON.stringify(collectedInfo), sessionId]
      );
    }

    const graph = getWorldGenerationGraph(checkpointer);

    const initialState: GraphInput = {
      sessionId,
      setting: session.setting,
      collectedInfo,
      outputLanguage,
    };

    const config = { configurable: { thread_id: sessionId } };

    try {
      // Обновляем статус
      await this.db.query(
        `UPDATE world_generation_sessions SET status = 'generating' WHERE id = $1`,
        [sessionId]
      );

      // Используем as unknown для обхода строгой типизации LangGraph
      const result = await graph.invoke(
        initialState as unknown as Parameters<typeof graph.invoke>[0],
        config
      );

      // Проверяем есть ли interrupt
      const state = await graph.getState(config);

      if (state.next && state.next.length > 0) {
        // Граф прерван, ждём ответа пользователя
        return {
          status: "waiting_for_input",
          clarification: state.values.pendingClarification ?? undefined,
        };
      }

      // Генерация завершена
      const worldData = this.buildWorldData(result);
      const validated = WorldDataSchema.parse(worldData);

      await this.db.query(
        `UPDATE world_generation_sessions SET generated_world = $1, status = 'review' WHERE id = $2`,
        [JSON.stringify(validated), sessionId]
      );

      return {
        status: "completed",
        world: validated,
      };
    } catch (error) {
      console.error("Generation error:", error);
      return {
        status: "error",
        error: String(error),
      };
    }
  }

  /**
   * Продолжение генерации после ответа пользователя
   */
  async continueGeneration(
    sessionId: string,
    response: ClarificationResponse
  ): Promise<GenerationResult> {
    const graph = getWorldGenerationGraph(checkpointer);
    const config = { configurable: { thread_id: sessionId } };

    try {
      // Используем Command.resume() для продолжения после interrupt
      const resumeCommand = new Command({ resume: response });
      const result = await graph.invoke(
        resumeCommand as unknown as Parameters<typeof graph.invoke>[0],
        config
      );

      const state = await graph.getState(config);

      if (state.next && state.next.length > 0) {
        // Ещё один interrupt
        return {
          status: "waiting_for_input",
          clarification: state.values.pendingClarification ?? undefined,
        };
      }

      // Генерация завершена
      const worldData = this.buildWorldData(result);
      const validated = WorldDataSchema.parse(worldData);

      await this.db.query(
        `UPDATE world_generation_sessions SET generated_world = $1, status = 'review' WHERE id = $2`,
        [JSON.stringify(validated), sessionId]
      );

      return {
        status: "completed",
        world: validated,
      };
    } catch (error) {
      console.error("Continue generation error:", error);
      return {
        status: "error",
        error: String(error),
      };
    }
  }

  /**
   * Streaming генерация для SSE
   */
  async *generateWorldStream(sessionId: string): AsyncGenerator<StreamEvent> {
    const session = await this.getSession(sessionId);
    const outputLanguage = await this.getOutputLanguage();

    const graph = getWorldGenerationGraph(checkpointer);

    const initialState: GraphInput = {
      sessionId,
      setting: session.setting,
      collectedInfo: session.collected_info,
      outputLanguage,
    };

    const config = { configurable: { thread_id: sessionId } };

    try {
      // Обновляем статус
      await this.db.query(
        `UPDATE world_generation_sessions SET status = 'generating' WHERE id = $1`,
        [sessionId]
      );

      // Используем stream для получения промежуточных результатов
      const streamInput = initialState as unknown as Parameters<
        typeof graph.stream
      >[0];
      for await (const event of await graph.stream(streamInput, config)) {
        for (const [nodeName, nodeOutput] of Object.entries(event)) {
          // Обновляем прогресс в БД
          if (nodeName in DEFAULT_PROGRESS) {
            await this.updateProgress(
              sessionId,
              nodeName as AgentName,
              "completed"
            );
          }

          yield {
            node: nodeName,
            status: "completed",
            data: nodeOutput as Partial<WorldGenerationStateType>,
          };
        }
      }

      // Проверяем финальное состояние
      const state = await graph.getState(config);

      if (state.next && state.next.length > 0) {
        yield {
          node: "interrupt",
          status: "waiting_for_input",
          clarification: state.values.pendingClarification ?? undefined,
        };
      } else {
        // Сохраняем результат
        const worldData = this.buildWorldData(state.values);
        const validated = WorldDataSchema.parse(worldData);

        await this.db.query(
          `UPDATE world_generation_sessions SET generated_world = $1, status = 'review' WHERE id = $2`,
          [JSON.stringify(validated), sessionId]
        );
      }
    } catch (error) {
      yield {
        node: "error",
        status: "error",
        data: { errors: [String(error)] },
      };
    }
  }

  /**
   * Legacy метод генерации (без HITL)
   */
  async generateWorld(sessionId: string): Promise<WorldData> {
    const result = await this.startGeneration(sessionId);

    if (result.status === "error") {
      throw new Error(result.error || "Generation failed");
    }

    if (result.status === "waiting_for_input") {
      // В legacy режиме автоматически пропускаем уточнения
      const skipResponse: ClarificationResponse = {
        requestId: result.clarification?.id || "",
        skipped: true,
        answers: {},
      };

      const continueResult = await this.continueGeneration(
        sessionId,
        skipResponse
      );

      if (continueResult.status === "error") {
        throw new Error(continueResult.error || "Generation failed");
      }

      if (continueResult.world) {
        return continueResult.world;
      }
    }

    if (result.world) {
      return result.world;
    }

    throw new Error("Failed to generate world");
  }

  private buildWorldData(state: Partial<WorldGenerationStateType>): WorldData {
    return {
      name: state.base?.name || "",
      genre: state.base?.genre || "",
      tone: state.base?.tone || "",
      world_primer: state.base?.world_primer || "",
      factions: state.factions ?? undefined,
      locations: state.locations ?? undefined,
      races: state.races ?? undefined,
      history: state.history ?? undefined,
      magic: state.magic ?? undefined,
    };
  }

  private async getSession(sessionId: string) {
    const result = await this.db.query(
      `SELECT * FROM world_generation_sessions WHERE id = $1`,
      [sessionId]
    );
    const session = result.rows[0] as
      | {
          setting: string;
          collected_info: string | string[];
        }
      | undefined;

    if (!session) {
      throw new Error("Session not found");
    }

    return {
      ...session,
      collected_info:
        typeof session.collected_info === "string"
          ? JSON.parse(session.collected_info)
          : session.collected_info || [],
    };
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

      const currentKnownInfo: string[] =
        typeof session.collected_info === "string"
          ? JSON.parse(session.collected_info)
          : session.collected_info || [];
      const newFacts: string[] = [];

      for (const [, answer] of Object.entries(answers)) {
        const trimmed = answer.trim().toLowerCase();

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

        newFacts.push(answer.trim());
      }

      const updatedInfo = [...currentKnownInfo, ...newFacts];
      await this.db.query(
        `UPDATE world_generation_sessions SET collected_info = $1 WHERE id = $2`,
        [JSON.stringify(updatedInfo), sessionId]
      );

      // Возвращаем статус ok, генерация будет запущена через SSE stream
      return { status: "ok" };
    } catch (error) {
      console.error("Failed to submit answers:", error);
      throw new Error("Failed to process answers and generate world");
    }
  }

  async saveWorld(sessionId: string, worldData: WorldData) {
    try {
      const validatedData = WorldDataSchema.parse(worldData);

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
