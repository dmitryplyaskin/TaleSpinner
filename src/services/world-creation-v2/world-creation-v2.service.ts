import { v4 as uuidv4 } from "uuid";
import { MemorySaver } from "@langchain/langgraph";
import { SessionRepository } from "./db";
import { createWorldCreationV2Graph, type WorldCreationV2Graph } from "./graph";
import type {
  Genre,
  Session,
  SessionStatus,
  WorldSkeleton,
  GeneratedWorld,
  ArchitectClarification,
  ElementsClarificationRequest,
  ClarificationResponse,
  GenerationProgress,
} from "./schemas";

/**
 * Тип ответа при запуске генерации
 */
export interface StartGenerationResult {
  status: SessionStatus;
  clarification?: ArchitectClarification;
  skeleton?: WorldSkeleton;
}

/**
 * Тип ответа при продолжении после уточнения
 */
export interface ContinueResult {
  status: SessionStatus;
  clarification?: ArchitectClarification | ElementsClarificationRequest;
  skeleton?: WorldSkeleton;
  world?: GeneratedWorld;
  progress?: GenerationProgress;
}

/**
 * Тип ответа при получении статуса
 */
export interface SessionStatusResult {
  session: Session;
  skeleton?: WorldSkeleton;
  world?: GeneratedWorld;
  clarification?: ArchitectClarification | ElementsClarificationRequest;
  progress?: GenerationProgress;
}

/**
 * Сервис для WorldCreationV2
 */
export class WorldCreationV2Service {
  private repository = new SessionRepository();
  private checkpointer = new MemorySaver();
  private graphs = new Map<string, WorldCreationV2Graph>();

  /**
   * Создать новую сессию с выбранным жанром
   */
  async createSession(genre: Genre): Promise<Session> {
    console.log(`[WorldCreationV2Service] Creating session with genre: ${genre}`);
    const session = await this.repository.create(genre);
    return session;
  }

  /**
   * Получить сессию по ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return this.repository.findById(sessionId);
  }

  /**
   * Начать генерацию (после ввода пользователя)
   */
  async startGeneration(
    sessionId: string,
    userInput: string
  ): Promise<StartGenerationResult> {
    console.log(`[WorldCreationV2Service] Starting generation for session: ${sessionId}`);

    // Обновляем сессию
    const session = await this.repository.update(sessionId, {
      status: "architect_working",
      userInput,
    });

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Создаём граф
    const graph = createWorldCreationV2Graph(this.checkpointer);
    this.graphs.set(sessionId, graph);

    // Запускаем граф
    const threadId = uuidv4();
    await this.repository.update(sessionId, {
      langgraphThreadId: threadId,
    });

    try {
      const result = await graph.invoke(
        {
          sessionId,
          genre: session.genre,
          userInput,
        },
        {
          configurable: { thread_id: threadId },
        }
      );

      // Обрабатываем результат
      if (result.pendingClarification) {
        await this.repository.update(sessionId, {
          status: "architect_asking",
          architectIterations: result.architectIterations,
        });

        // Сохраняем запрос уточнения
        await this.repository.saveClarificationRequest(
          sessionId,
          "architect",
          result.pendingClarification
        );

        return {
          status: "architect_asking",
          clarification: result.pendingClarification as ArchitectClarification,
        };
      }

      if (result.skeleton) {
        await this.repository.update(sessionId, {
          status: "skeleton_ready",
          skeleton: result.skeleton,
        });

        return {
          status: "skeleton_ready",
          skeleton: result.skeleton,
        };
      }

      return { status: session.status };
    } catch (error) {
      // Проверяем, это interrupt или реальная ошибка
      if (this.isInterruptError(error)) {
        const interruptValue = this.getInterruptValue(error);

        if (interruptValue && interruptValue.type === "architect_clarification") {
          await this.repository.update(sessionId, {
            status: "architect_asking",
          });

          await this.repository.saveClarificationRequest(
            sessionId,
            "architect",
            interruptValue
          );

          return {
            status: "architect_asking",
            clarification: interruptValue,
          };
        }
      }

      console.error("[WorldCreationV2Service] Error in startGeneration:", error);
      throw error;
    }
  }

  /**
   * Ответить на уточняющие вопросы
   */
  async respondToClarification(
    sessionId: string,
    response: ClarificationResponse
  ): Promise<ContinueResult> {
    console.log(`[WorldCreationV2Service] Responding to clarification for: ${sessionId}`);

    const session = await this.repository.findById(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Сохраняем ответ
    const lastClarification = await this.repository.getLastClarification(sessionId);
    if (lastClarification) {
      await this.repository.saveClarificationResponse(lastClarification.id, response);
    }

    // Получаем граф и продолжаем
    const graph = this.graphs.get(sessionId);
    if (!graph) {
      throw new Error(`Graph not found for session: ${sessionId}`);
    }

    try {
      // Продолжаем выполнение графа с ответом пользователя
      // При resume после interrupt передаём данные, которые станут возвратом из interrupt()
      const result = await graph.invoke(
        { answers: response.answers } as Parameters<typeof graph.invoke>[0],
        {
          configurable: { thread_id: session.langgraphThreadId },
        }
      );

      return this.processGraphResult(sessionId, result);
    } catch (error) {
      if (this.isInterruptError(error)) {
        const interruptValue = this.getInterruptValue(error);
        if (interruptValue) {
          return this.handleInterrupt(sessionId, interruptValue);
        }
      }
      throw error;
    }
  }

  /**
   * Одобрить скелет мира и начать генерацию элементов
   */
  async approveSkeleton(
    sessionId: string,
    editedSkeleton?: WorldSkeleton
  ): Promise<ContinueResult> {
    console.log(`[WorldCreationV2Service] Approving skeleton for: ${sessionId}`);

    const session = await this.repository.findById(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Если пользователь отредактировал скелет - сохраняем
    if (editedSkeleton) {
      await this.repository.update(sessionId, {
        skeleton: editedSkeleton,
      });
    }

    await this.repository.update(sessionId, {
      status: "elements_generating",
    });

    // Получаем граф и продолжаем с флагом одобрения
    const graph = this.graphs.get(sessionId);
    if (!graph) {
      throw new Error(`Graph not found for session: ${sessionId}`);
    }

    try {
      // Продолжаем с флагом одобрения
      const result = await graph.invoke(
        { skeletonApproved: true } as Parameters<typeof graph.invoke>[0],
        {
          configurable: { thread_id: session.langgraphThreadId },
        }
      );

      return this.processGraphResult(sessionId, result);
    } catch (error) {
      if (this.isInterruptError(error)) {
        const interruptValue = this.getInterruptValue(error);
        if (interruptValue) {
          return this.handleInterrupt(sessionId, interruptValue);
        }
      }
      throw error;
    }
  }

  /**
   * Получить полный статус сессии
   */
  async getSessionStatus(sessionId: string): Promise<SessionStatusResult> {
    const session = await this.repository.findById(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const skeleton = await this.repository.getSkeleton(sessionId);
    const world = await this.repository.getGeneratedWorld(sessionId);
    const lastClarification = await this.repository.getLastClarification(sessionId);

    const result: SessionStatusResult = {
      session,
      skeleton: skeleton ?? undefined,
      world: world ?? undefined,
    };

    if (lastClarification && !lastClarification.response) {
      result.clarification = lastClarification.request;
    }

    return result;
  }

  /**
   * Сохранить финальный мир
   */
  async saveWorld(
    sessionId: string,
    editedWorld?: GeneratedWorld
  ): Promise<{ success: boolean; worldId: string }> {
    console.log(`[WorldCreationV2Service] Saving world for: ${sessionId}`);

    const session = await this.repository.findById(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const skeleton = await this.repository.getSkeleton(sessionId);
    
    // Формируем финальный мир
    const generatedWorld = editedWorld || (await this.repository.getGeneratedWorld(sessionId));
    
    if (!skeleton) {
      throw new Error("No skeleton available");
    }

    // Создаём финальный объект мира если его нет
    const finalWorld: GeneratedWorld = generatedWorld || {
      skeleton,
      categories: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        totalElements: 0,
        generationTimeMs: 0,
      },
    };

    await this.repository.update(sessionId, {
      status: "saved",
      generatedWorld: finalWorld,
    });

    // Очищаем граф из памяти
    this.graphs.delete(sessionId);

    return {
      success: true,
      worldId: sessionId,
    };
  }

  /**
   * Обработать результат графа
   */
  private async processGraphResult(
    sessionId: string,
    result: Record<string, unknown>
  ): Promise<ContinueResult> {
    // Проверяем на уточнения
    if (result.pendingClarification) {
      const clarification = result.pendingClarification as
        | ArchitectClarification
        | ElementsClarificationRequest;

      const clarificationType =
        clarification.type === "architect_clarification" ? "architect" : "elements";

      await this.repository.update(sessionId, {
        status:
          clarificationType === "architect" ? "architect_asking" : "elements_asking",
      });

      await this.repository.saveClarificationRequest(
        sessionId,
        clarificationType,
        clarification
      );

      return {
        status:
          clarificationType === "architect" ? "architect_asking" : "elements_asking",
        clarification,
      };
    }

    // Проверяем на готовый скелет
    if (result.skeleton && result.currentPhase === "skeleton_ready") {
      await this.repository.update(sessionId, {
        status: "skeleton_ready",
        skeleton: result.skeleton as WorldSkeleton,
      });

      return {
        status: "skeleton_ready",
        skeleton: result.skeleton as WorldSkeleton,
      };
    }

    // Проверяем на завершение
    if (result.currentPhase === "completed") {
      const skeleton = await this.repository.getSkeleton(sessionId);
      const categories = result.generatedCategories as GeneratedWorld["categories"];

      const world: GeneratedWorld = {
        skeleton: skeleton!,
        categories,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalElements: categories.reduce((sum, c) => sum + c.elements.length, 0),
          generationTimeMs: 0,
        },
      };

      await this.repository.update(sessionId, {
        status: "completed",
        generatedWorld: world,
      });

      return {
        status: "completed",
        world,
      };
    }

    // Генерация в процессе
    const session = await this.repository.findById(sessionId);
    return {
      status: session?.status || "elements_generating",
      progress: {
        currentElement: (result.currentElementType as string) || "",
        completedElements: ((result.generatedCategories as Array<{ categoryId: string }>) || []).map(
          (c) => c.categoryId
        ),
        totalElements: ((result.elementsToGenerate as string[]) || []).length,
        status: "generating",
      },
    };
  }

  /**
   * Обработать interrupt
   */
  private async handleInterrupt(
    sessionId: string,
    clarification: ArchitectClarification | ElementsClarificationRequest
  ): Promise<ContinueResult> {

    const clarificationType =
      clarification.type === "architect_clarification" ? "architect" : "elements";

    await this.repository.update(sessionId, {
      status:
        clarificationType === "architect" ? "architect_asking" : "elements_asking",
    });

    await this.repository.saveClarificationRequest(
      sessionId,
      clarificationType,
      clarification
    );

    return {
      status:
        clarificationType === "architect" ? "architect_asking" : "elements_asking",
      clarification,
    };
  }

  /**
   * Проверить, является ли ошибка interrupt'ом
   */
  private isInterruptError(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === "object" &&
      "name" in error &&
      (error as Error).name === "GraphInterrupt"
    );
  }

  /**
   * Получить значение interrupt'а
   */
  private getInterruptValue(
    error: unknown
  ): (ArchitectClarification | ElementsClarificationRequest) | null {
    if (
      error !== null &&
      typeof error === "object" &&
      "value" in error
    ) {
      const value = (error as { value: unknown }).value;
      if (
        value &&
        typeof value === "object" &&
        "type" in value
      ) {
        return value as ArchitectClarification | ElementsClarificationRequest;
      }
    }
    return null;
  }
}

