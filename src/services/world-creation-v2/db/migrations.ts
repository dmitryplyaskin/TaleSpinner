/**
 * SQL миграции для WorldCreationV2
 */

export const WORLD_CREATION_V2_MIGRATIONS = `
  -- Таблица сессий создания мира
  CREATE TABLE IF NOT EXISTS world_creation_v2_sessions (
    id UUID PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'genre_selected',
    genre VARCHAR(50) NOT NULL,
    user_input TEXT DEFAULT '',
    skeleton JSONB,
    generated_world JSONB,
    langgraph_thread_id VARCHAR(255),
    architect_iterations INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Таблица истории уточнений
  CREATE TABLE IF NOT EXISTS world_creation_v2_clarifications (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES world_creation_v2_sessions(id) ON DELETE CASCADE,
    clarification_type VARCHAR(50) NOT NULL,
    request JSONB NOT NULL,
    response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Индексы для оптимизации
  CREATE INDEX IF NOT EXISTS idx_wc_v2_sessions_status 
    ON world_creation_v2_sessions(status);
  
  CREATE INDEX IF NOT EXISTS idx_wc_v2_sessions_created_at 
    ON world_creation_v2_sessions(created_at DESC);
  
  CREATE INDEX IF NOT EXISTS idx_wc_v2_clarifications_session_id 
    ON world_creation_v2_clarifications(session_id);
`;

/**
 * Выполнить миграции для WorldCreationV2
 */
export async function runWorldCreationV2Migrations(db: {
  exec: (sql: string) => Promise<unknown>;
}): Promise<void> {
  console.log("[WorldCreationV2] Running migrations...");
  await db.exec(WORLD_CREATION_V2_MIGRATIONS);
  console.log("[WorldCreationV2] Migrations completed.");
}
