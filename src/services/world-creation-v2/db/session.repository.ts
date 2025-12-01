import { v4 as uuidv4 } from "uuid";
import { DbService } from "@core/services/db.service";
import type {
  Session,
  SessionStatus,
  Genre,
  WorldSkeleton,
  GeneratedWorld,
  ClarificationRecord,
  AnyClarificationRequest,
  ClarificationResponse,
} from "../schemas";

/**
 * Тип строки из БД для сессии
 */
interface SessionRow {
  id: string;
  status: SessionStatus;
  genre: Genre;
  user_input: string;
  skeleton: WorldSkeleton | null;
  generated_world: GeneratedWorld | null;
  langgraph_thread_id: string | null;
  architect_iterations: number;
  created_at: string;
  updated_at: string;
}

/**
 * Тип строки из БД для уточнений
 */
interface ClarificationRow {
  id: string;
  session_id: string;
  clarification_type: "architect" | "elements";
  request: AnyClarificationRequest;
  response: ClarificationResponse | null;
  created_at: string;
}

/**
 * Репозиторий для работы с сессиями WorldCreationV2
 */
export class SessionRepository {
  private db = DbService.getInstance().getClient();

  /**
   * Создать новую сессию
   */
  async create(genre: Genre): Promise<Session> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.query(
      `INSERT INTO world_creation_v2_sessions 
        (id, status, genre, user_input, architect_iterations, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, "genre_selected", genre, "", 0, now, now]
    );

    return {
      id,
      status: "genre_selected",
      genre,
      userInput: "",
      architectIterations: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Получить сессию по ID
   */
  async findById(id: string): Promise<Session | null> {
    const result = await this.db.query<SessionRow>(
      `SELECT * FROM world_creation_v2_sessions WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSession(result.rows[0]);
  }

  /**
   * Обновить сессию
   */
  async update(
    id: string,
    updates: Partial<{
      status: SessionStatus;
      userInput: string;
      skeleton: WorldSkeleton | null;
      generatedWorld: GeneratedWorld | null;
      langgraphThreadId: string;
      architectIterations: number;
    }>
  ): Promise<Session | null> {
    const setClauses: string[] = [];
    const values: (string | number | object | null)[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.userInput !== undefined) {
      setClauses.push(`user_input = $${paramIndex++}`);
      values.push(updates.userInput);
    }
    if (updates.skeleton !== undefined) {
      setClauses.push(`skeleton = $${paramIndex++}`);
      values.push(updates.skeleton ? JSON.stringify(updates.skeleton) : null);
    }
    if (updates.generatedWorld !== undefined) {
      setClauses.push(`generated_world = $${paramIndex++}`);
      values.push(
        updates.generatedWorld ? JSON.stringify(updates.generatedWorld) : null
      );
    }
    if (updates.langgraphThreadId !== undefined) {
      setClauses.push(`langgraph_thread_id = $${paramIndex++}`);
      values.push(updates.langgraphThreadId);
    }
    if (updates.architectIterations !== undefined) {
      setClauses.push(`architect_iterations = $${paramIndex++}`);
      values.push(updates.architectIterations);
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    setClauses.push(`updated_at = $${paramIndex++}`);
    values.push(new Date().toISOString());

    values.push(id);

    await this.db.query(
      `UPDATE world_creation_v2_sessions 
       SET ${setClauses.join(", ")} 
       WHERE id = $${paramIndex}`,
      values
    );

    return this.findById(id);
  }

  /**
   * Получить скелет мира для сессии
   */
  async getSkeleton(sessionId: string): Promise<WorldSkeleton | null> {
    const result = await this.db.query<{ skeleton: WorldSkeleton | null }>(
      `SELECT skeleton FROM world_creation_v2_sessions WHERE id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].skeleton;
  }

  /**
   * Получить сгенерированный мир для сессии
   */
  async getGeneratedWorld(sessionId: string): Promise<GeneratedWorld | null> {
    const result = await this.db.query<{
      generated_world: GeneratedWorld | null;
    }>(`SELECT generated_world FROM world_creation_v2_sessions WHERE id = $1`, [
      sessionId,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].generated_world;
  }

  /**
   * Удалить сессию
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM world_creation_v2_sessions WHERE id = $1`,
      [id]
    );

    return (result.affectedRows ?? 0) > 0;
  }

  /**
   * Сохранить запрос уточнения
   */
  async saveClarificationRequest(
    sessionId: string,
    clarificationType: "architect" | "elements",
    request: AnyClarificationRequest
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.query(
      `INSERT INTO world_creation_v2_clarifications 
        (id, session_id, clarification_type, request, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, sessionId, clarificationType, JSON.stringify(request), now]
    );

    return id;
  }

  /**
   * Сохранить ответ на уточнение
   */
  async saveClarificationResponse(
    clarificationId: string,
    response: ClarificationResponse
  ): Promise<void> {
    await this.db.query(
      `UPDATE world_creation_v2_clarifications 
       SET response = $1 
       WHERE id = $2`,
      [JSON.stringify(response), clarificationId]
    );
  }

  /**
   * Получить последнее уточнение для сессии
   */
  async getLastClarification(
    sessionId: string
  ): Promise<ClarificationRecord | null> {
    const result = await this.db.query<ClarificationRow>(
      `SELECT * FROM world_creation_v2_clarifications 
       WHERE session_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      sessionId: row.session_id,
      clarificationType: row.clarification_type,
      request: row.request,
      response: row.response ?? undefined,
      createdAt: row.created_at,
    };
  }

  /**
   * Получить историю уточнений для сессии
   */
  async getClarificationHistory(
    sessionId: string
  ): Promise<ClarificationRecord[]> {
    const result = await this.db.query<ClarificationRow>(
      `SELECT * FROM world_creation_v2_clarifications 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [sessionId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      clarificationType: row.clarification_type,
      request: row.request,
      response: row.response ?? undefined,
      createdAt: row.created_at,
    }));
  }

  /**
   * Преобразовать строку БД в объект Session
   */
  private mapRowToSession(row: SessionRow): Session {
    return {
      id: row.id,
      status: row.status,
      genre: row.genre,
      userInput: row.user_input,
      architectIterations: row.architect_iterations,
      langgraphThreadId: row.langgraph_thread_id ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
