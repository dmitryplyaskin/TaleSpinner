import { connect, Connection, Table, WriteMode } from "@lancedb/lancedb";
import {
  Schema,
  Field,
  Float32,
  Utf8,
  Int32,
  Bool,
  FixedSizeList,
} from "apache-arrow";

export interface GameDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  vector: number[];
  category: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface SearchOptions {
  limit?: number;
  where?: string;
  prefilter?: boolean;
  refine_factor?: number;
}

export interface UpsertOptions {
  mode?: WriteMode;
}

export class LanceDBService {
  private connection: Connection | null = null;
  private tables: Map<string, Table> = new Map();
  private readonly dbPath: string;
  private readonly vectorDimensions: number;

  constructor(dbPath: string = "./lancedb", vectorDimensions: number = 1536) {
    this.dbPath = dbPath;
    this.vectorDimensions = vectorDimensions;
  }

  /**
   * Инициализация подключения к базе данных
   */
  async initialize(): Promise<void> {
    try {
      this.connection = await connect(this.dbPath);
      console.log(`✅ LanceDB connected at: ${this.dbPath}`);
    } catch (error) {
      console.error("❌ Failed to connect to LanceDB:", error);
      throw error;
    }
  }

  /**
   * Создание схемы для игровых документов
   */
  private createGameDocumentSchema(): Schema {
    return new Schema([
      new Field("id", new Utf8()),
      new Field("content", new Utf8()),
      new Field("metadata", new Utf8()), // JSON string
      new Field(
        "vector",
        new FixedSizeList(
          this.vectorDimensions,
          new Field("item", new Float32())
        )
      ),
      new Field("category", new Utf8()),
      new Field("tags", new Utf8()), // JSON array as string
      new Field("created_at", new Utf8()),
      new Field("updated_at", new Utf8()),
    ]);
  }

  /**
   * Создание или получение таблицы
   */
  async getOrCreateTable(tableName: string): Promise<Table> {
    if (!this.connection) {
      throw new Error("Database not initialized. Call initialize() first.");
    }

    if (this.tables.has(tableName)) {
      return this.tables.get(tableName)!;
    }

    try {
      // Проверяем, существует ли таблица
      const existingTables = await this.connection.tableNames();

      let table: Table;
      if (existingTables.includes(tableName)) {
        table = await this.connection.openTable(tableName);
        console.log(`📖 Opened existing table: ${tableName}`);
      } else {
        // Создаем новую таблицу с пустыми данными
        const schema = this.createGameDocumentSchema();
        table = await this.connection.createEmptyTable(tableName, schema);
        console.log(`🆕 Created new table: ${tableName}`);
      }

      this.tables.set(tableName, table);
      return table;
    } catch (error) {
      console.error(`❌ Failed to get/create table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Добавление или обновление документов
   */
  async upsert(
    tableName: string,
    documents: GameDocument[],
    options: UpsertOptions = {}
  ): Promise<void> {
    const table = await this.getOrCreateTable(tableName);

    try {
      // Преобразуем документы в формат для LanceDB
      const data = documents.map((doc) => ({
        id: doc.id,
        content: doc.content,
        metadata: JSON.stringify(doc.metadata),
        vector: doc.vector,
        category: doc.category,
        tags: JSON.stringify(doc.tags),
        created_at: doc.created_at.toISOString(),
        updated_at: doc.updated_at.toISOString(),
      }));

      await table.add(data, { mode: options.mode || WriteMode.Append });

      console.log(`✅ Upserted ${documents.length} documents to ${tableName}`);
    } catch (error) {
      console.error(`❌ Failed to upsert documents to ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Векторный поиск по сходству
   */
  async similaritySearch(
    tableName: string,
    queryVector: number[],
    options: SearchOptions = {}
  ): Promise<GameDocument[]> {
    const table = await this.getOrCreateTable(tableName);

    try {
      let query = table.vectorSearch(queryVector).limit(options.limit || 10);

      if (options.where) {
        query = query.where(options.where);
      }

      if (options.prefilter !== undefined) {
        query = query.prefilter(options.prefilter);
      }

      if (options.refine_factor) {
        query = query.refineFactor(options.refine_factor);
      }

      const results = await query.toArray();

      return results.map(this.mapResultToGameDocument);
    } catch (error) {
      console.error(
        `❌ Failed to perform similarity search in ${tableName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Поиск по тексту с фильтрацией
   */
  async search(
    tableName: string,
    filters: {
      category?: string;
      tags?: string[];
      textContains?: string;
      dateRange?: { from: Date; to: Date };
    },
    limit: number = 50
  ): Promise<GameDocument[]> {
    const table = await this.getOrCreateTable(tableName);

    try {
      let whereClause: string[] = [];

      if (filters.category) {
        whereClause.push(`category = '${filters.category}'`);
      }

      if (filters.textContains) {
        whereClause.push(`content LIKE '%${filters.textContains}%'`);
      }

      if (filters.dateRange) {
        const from = filters.dateRange.from.toISOString();
        const to = filters.dateRange.to.toISOString();
        whereClause.push(`created_at >= '${from}' AND created_at <= '${to}'`);
      }

      let query = table.search();

      if (whereClause.length > 0) {
        query = query.where(whereClause.join(" AND "));
      }

      const results = await query.limit(limit).toArray();

      let filteredResults = results.map(this.mapResultToGameDocument);

      // Дополнительная фильтрация по тегам (если указана)
      if (filters.tags && filters.tags.length > 0) {
        filteredResults = filteredResults.filter((doc) =>
          filters.tags!.some((tag) => doc.tags.includes(tag))
        );
      }

      return filteredResults;
    } catch (error) {
      console.error(`❌ Failed to search in ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Получение документа по ID
   */
  async getById(tableName: string, id: string): Promise<GameDocument | null> {
    const table = await this.getOrCreateTable(tableName);

    try {
      const results = await table
        .search()
        .where(`id = '${id}'`)
        .limit(1)
        .toArray();

      return results.length > 0
        ? this.mapResultToGameDocument(results[0])
        : null;
    } catch (error) {
      console.error(
        `❌ Failed to get document by ID from ${tableName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Удаление документов
   */
  async delete(tableName: string, ids: string[]): Promise<void> {
    const table = await this.getOrCreateTable(tableName);

    try {
      const whereClause = ids.map((id) => `id = '${id}'`).join(" OR ");
      await table.delete(whereClause);

      console.log(`✅ Deleted ${ids.length} documents from ${tableName}`);
    } catch (error) {
      console.error(`❌ Failed to delete documents from ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Получение статистики таблицы
   */
  async getTableStats(tableName: string): Promise<{
    count: number;
    categories: string[];
    size: string;
  }> {
    const table = await this.getOrCreateTable(tableName);

    try {
      const results = await table.search().toArray();
      const categories = [...new Set(results.map((r) => r.category))];

      return {
        count: results.length,
        categories,
        size: `${(JSON.stringify(results).length / 1024 / 1024).toFixed(2)} MB`,
      };
    } catch (error) {
      console.error(`❌ Failed to get table stats for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Создание индекса для оптимизации поиска
   */
  async createIndex(
    tableName: string,
    column: string = "vector"
  ): Promise<void> {
    const table = await this.getOrCreateTable(tableName);

    try {
      await table.createIndex(column, {
        type: "ivf_pq",
        num_partitions: 256,
        num_sub_vectors: 96,
      });

      console.log(`✅ Created index on ${column} for table ${tableName}`);
    } catch (error) {
      console.error(`❌ Failed to create index for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Закрытие соединения
   */
  async close(): Promise<void> {
    this.tables.clear();
    this.connection = null;
    console.log("🔒 LanceDB connection closed");
  }

  /**
   * Преобразование результата запроса в GameDocument
   */
  private mapResultToGameDocument(result: any): GameDocument {
    return {
      id: result.id,
      content: result.content,
      metadata: JSON.parse(result.metadata || "{}"),
      vector: Array.from(result.vector),
      category: result.category,
      tags: JSON.parse(result.tags || "[]"),
      created_at: new Date(result.created_at),
      updated_at: new Date(result.updated_at),
    };
  }
}

// Пример использования и вспомогательные утилиты
export class GameLoreService extends LanceDBService {
  private readonly CHARACTERS_TABLE = "characters";
  private readonly LOCATIONS_TABLE = "locations";
  private readonly STORY_TABLE = "story_events";
  private readonly DIALOGUES_TABLE = "dialogues";

  /**
   * Добавление персонажа
   */
  async addCharacter(character: {
    name: string;
    description: string;
    traits: string[];
    backstory: string;
    vector: number[];
  }): Promise<void> {
    const document: GameDocument = {
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: `${character.name}: ${character.description}\nBackstory: ${character.backstory}`,
      metadata: {
        name: character.name,
        traits: character.traits,
        type: "character",
      },
      vector: character.vector,
      category: "character",
      tags: ["character", ...character.traits],
      created_at: new Date(),
      updated_at: new Date(),
    };

    await this.upsert(this.CHARACTERS_TABLE, [document]);
  }

  /**
   * Поиск персонажей по описанию
   */
  async findSimilarCharacters(
    queryVector: number[],
    limit: number = 5
  ): Promise<GameDocument[]> {
    return this.similaritySearch(this.CHARACTERS_TABLE, queryVector, { limit });
  }

  /**
   * Добавление локации
   */
  async addLocation(location: {
    name: string;
    description: string;
    atmosphere: string;
    connections: string[];
    vector: number[];
  }): Promise<void> {
    const document: GameDocument = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: `${location.name}: ${location.description}\nAtmosphere: ${location.atmosphere}`,
      metadata: {
        name: location.name,
        connections: location.connections,
        type: "location",
      },
      vector: location.vector,
      category: "location",
      tags: ["location", location.atmosphere],
      created_at: new Date(),
      updated_at: new Date(),
    };

    await this.upsert(this.LOCATIONS_TABLE, [document]);
  }

  /**
   * Поиск контекста для RAG на основе текущей ситуации в игре
   */
  async getRelevantContext(
    queryVector: number[],
    currentLocation?: string,
    involvedCharacters?: string[],
    limit: number = 10
  ): Promise<{
    characters: GameDocument[];
    locations: GameDocument[];
    events: GameDocument[];
    dialogues: GameDocument[];
  }> {
    const [characters, locations, events, dialogues] = await Promise.all([
      this.similaritySearch(this.CHARACTERS_TABLE, queryVector, {
        limit: Math.ceil(limit * 0.3),
      }),
      this.similaritySearch(this.LOCATIONS_TABLE, queryVector, {
        limit: Math.ceil(limit * 0.2),
      }),
      this.similaritySearch(this.STORY_TABLE, queryVector, {
        limit: Math.ceil(limit * 0.3),
      }),
      this.similaritySearch(this.DIALOGUES_TABLE, queryVector, {
        limit: Math.ceil(limit * 0.2),
      }),
    ]);

    return { characters, locations, events, dialogues };
  }
}
