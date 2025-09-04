import { JsonFileService } from "../../core/services/json-file.service";
import { ChatSession, ChatMessage } from "./chat.service";

export interface ChatHistoryData {
  sessions: Record<string, ChatSession>;
  activeSessionId?: string;
  metadata?: Record<string, any>;
}

export class ChatHistoryService {
  private historyService: JsonFileService<ChatHistoryData>;

  constructor(dataPath: string = "./data/chat-history") {
    this.historyService = new JsonFileService<ChatHistoryData>(
      dataPath,
      "chat-history"
    );

    // Создаем файл истории если его нет
    this.initializeHistory();
  }

  /**
   * Инициализирует файл истории чата
   */
  private async initializeHistory(): Promise<void> {
    try {
      await this.historyService.createFile(
        {
          sessions: {},
          metadata: {
            createdAt: new Date().toISOString(),
          },
        },
        { skipIfExists: true }
      );
    } catch (error) {
      console.error("Ошибка инициализации истории чата:", error);
    }
  }

  /**
   * Сохраняет сессию чата
   */
  async saveSession(session: ChatSession): Promise<ChatSession> {
    try {
      const history = await this.historyService.readFile("chat-history");

      if (!history) {
        throw new Error("История чата не найдена");
      }

      const updatedHistory: ChatHistoryData = {
        ...history,
        sessions: {
          ...history.sessions,
          [session.id]: session,
        },
      };

      await this.historyService.updateFile("chat-history", updatedHistory);
      return session;
    } catch (error) {
      console.error("Ошибка сохранения сессии:", error);
      throw error;
    }
  }

  /**
   * Загружает сессию чата по ID
   */
  async loadSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const history = await this.historyService.readFile("chat-history");

      if (!history || !history.sessions[sessionId]) {
        return null;
      }

      return history.sessions[sessionId];
    } catch (error) {
      console.error("Ошибка загрузки сессии:", error);
      return null;
    }
  }

  /**
   * Получает все сессии
   */
  async getAllSessions(): Promise<ChatSession[]> {
    try {
      const history = await this.historyService.readFile("chat-history");

      if (!history) {
        return [];
      }

      return Object.values(history.sessions).sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error("Ошибка получения всех сессий:", error);
      return [];
    }
  }

  /**
   * Удаляет сессию
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const history = await this.historyService.readFile("chat-history");

      if (!history || !history.sessions[sessionId]) {
        return false;
      }

      const { [sessionId]: deletedSession, ...remainingSessions } =
        history.sessions;

      const updatedHistory: ChatHistoryData = {
        ...history,
        sessions: remainingSessions,
        activeSessionId:
          history.activeSessionId === sessionId
            ? undefined
            : history.activeSessionId,
      };

      await this.historyService.updateFile("chat-history", updatedHistory);
      return true;
    } catch (error) {
      console.error("Ошибка удаления сессии:", error);
      return false;
    }
  }

  /**
   * Устанавливает активную сессию
   */
  async setActiveSession(sessionId: string): Promise<boolean> {
    try {
      const history = await this.historyService.readFile("chat-history");

      if (!history || !history.sessions[sessionId]) {
        return false;
      }

      const updatedHistory: ChatHistoryData = {
        ...history,
        activeSessionId: sessionId,
      };

      await this.historyService.updateFile("chat-history", updatedHistory);
      return true;
    } catch (error) {
      console.error("Ошибка установки активной сессии:", error);
      return false;
    }
  }

  /**
   * Получает активную сессию
   */
  async getActiveSession(): Promise<ChatSession | null> {
    try {
      const history = await this.historyService.readFile("chat-history");

      if (!history || !history.activeSessionId) {
        return null;
      }

      return history.sessions[history.activeSessionId] || null;
    } catch (error) {
      console.error("Ошибка получения активной сессии:", error);
      return null;
    }
  }

  /**
   * Добавляет сообщение к существующей сессии
   */
  async addMessageToSession(
    sessionId: string,
    message: ChatMessage
  ): Promise<ChatSession | null> {
    try {
      const session = await this.loadSession(sessionId);

      if (!session) {
        return null;
      }

      const updatedSession: ChatSession = {
        ...session,
        messages: [...session.messages, message],
        updatedAt: new Date(),
      };

      return await this.saveSession(updatedSession);
    } catch (error) {
      console.error("Ошибка добавления сообщения:", error);
      return null;
    }
  }

  /**
   * Очищает всю историю
   */
  async clearHistory(): Promise<boolean> {
    try {
      const clearedHistory: ChatHistoryData = {
        sessions: {},
        metadata: {
          clearedAt: new Date().toISOString(),
        },
      };

      await this.historyService.updateFile("chat-history", clearedHistory);
      return true;
    } catch (error) {
      console.error("Ошибка очистки истории:", error);
      return false;
    }
  }

  /**
   * Экспортирует историю в JSON
   */
  async exportHistory(): Promise<ChatHistoryData | null> {
    try {
      return await this.historyService.readFile("chat-history");
    } catch (error) {
      console.error("Ошибка экспорта истории:", error);
      return null;
    }
  }

  /**
   * Импортирует историю из JSON
   */
  async importHistory(historyData: ChatHistoryData): Promise<boolean> {
    try {
      await this.historyService.updateFile("chat-history", historyData);
      return true;
    } catch (error) {
      console.error("Ошибка импорта истории:", error);
      return false;
    }
  }

  /**
   * Получает статистику по истории
   */
  async getHistoryStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    avgMessagesPerSession: number;
    oldestSession?: Date;
    newestSession?: Date;
  }> {
    try {
      const sessions = await this.getAllSessions();

      if (sessions.length === 0) {
        return {
          totalSessions: 0,
          totalMessages: 0,
          avgMessagesPerSession: 0,
        };
      }

      const totalMessages = sessions.reduce(
        (sum, session) => sum + session.messages.length,
        0
      );
      const sessionDates = sessions.map((s) => new Date(s.createdAt));

      return {
        totalSessions: sessions.length,
        totalMessages,
        avgMessagesPerSession: Math.round(totalMessages / sessions.length),
        oldestSession: new Date(
          Math.min(...sessionDates.map((d) => d.getTime()))
        ),
        newestSession: new Date(
          Math.max(...sessionDates.map((d) => d.getTime()))
        ),
      };
    } catch (error) {
      console.error("Ошибка получения статистики:", error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        avgMessagesPerSession: 0,
      };
    }
  }
}
