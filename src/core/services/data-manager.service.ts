import { JsonFileManager } from "./json-file-manager.service";
import { v4 as uuidv4 } from "uuid";

export interface DataManagerConfig {
  basePath?: string;
  defaultFolder?: string;
}

export interface DataRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface CreateDataRequest<T = any> {
  id?: string;
  data: Omit<T, "id" | "createdAt" | "updatedAt">;
}

export interface UpdateDataRequest<T = any> {
  data: Partial<Omit<T, "id" | "createdAt">>;
}

export interface AppendDataRequest<T = any> {
  field: keyof T;
  value: any;
}

export class DataManagerService {
  private jsonFileManager: JsonFileManager;
  private defaultFolder: string;

  constructor(config: DataManagerConfig = {}) {
    this.jsonFileManager = new JsonFileManager(config.basePath);
    this.defaultFolder = config.defaultFolder || "data";
  }

  /**
   * Создает новый файл с данными
   */
  async create<T extends DataRecord>(
    request: CreateDataRequest<T>,
    folder?: string
  ): Promise<T> {
    const targetFolder = folder || this.defaultFolder;
    const id = request.id || this.generateId();
    const now = new Date();

    const record: T = {
      id,
      createdAt: now,
      updatedAt: now,
      ...request.data,
    } as T;

    await this.jsonFileManager.createFile(targetFolder, id, record);
    return record;
  }

  /**
   * Читает данные из файла
   */
  async read<T extends DataRecord>(
    id: string,
    folder?: string
  ): Promise<T | null> {
    const targetFolder = folder || this.defaultFolder;

    try {
      const data = await this.jsonFileManager.getContent(targetFolder, id);
      return data as T;
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  /**
   * Обновляет существующий файл
   */
  async update<T extends DataRecord>(
    id: string,
    request: UpdateDataRequest<T>,
    folder?: string
  ): Promise<T> {
    const targetFolder = folder || this.defaultFolder;
    const existingData = await this.read<T>(id, targetFolder);

    if (!existingData) {
      throw new Error(`Record with id ${id} not found`);
    }

    const updatedRecord: T = {
      ...existingData,
      ...request.data,
      updatedAt: new Date(),
    } as T;

    await this.jsonFileManager.editFile(targetFolder, id, updatedRecord);
    return updatedRecord;
  }

  /**
   * Удаляет файл
   */
  async delete(id: string, folder?: string): Promise<void> {
    const targetFolder = folder || this.defaultFolder;
    await this.jsonFileManager.deleteFile(targetFolder, id);
  }

  /**
   * Дополняет данные в файле (добавляет элементы в массивы или обновляет объекты)
   */
  async append<T extends DataRecord>(
    id: string,
    request: AppendDataRequest<T>,
    folder?: string
  ): Promise<T> {
    const targetFolder = folder || this.defaultFolder;
    const existingData = await this.read<T>(id, targetFolder);

    if (!existingData) {
      throw new Error(`Record with id ${id} not found`);
    }

    const updatedRecord = { ...existingData } as any;
    const fieldValue = updatedRecord[request.field as string];

    // Если поле является массивом, добавляем элемент
    if (Array.isArray(fieldValue)) {
      updatedRecord[request.field as string].push(request.value);
    }
    // Если поле является объектом, объединяем объекты
    else if (typeof fieldValue === "object" && fieldValue !== null) {
      updatedRecord[request.field as string] = {
        ...fieldValue,
        ...request.value,
      };
    }
    // Иначе просто заменяем значение
    else {
      updatedRecord[request.field as string] = request.value;
    }

    updatedRecord.updatedAt = new Date();

    await this.jsonFileManager.editFile(targetFolder, id, updatedRecord);
    return updatedRecord as T;
  }

  /**
   * Дублирует файл с новым id
   */
  async duplicate<T extends DataRecord>(
    originalId: string,
    newId?: string,
    folder?: string
  ): Promise<T> {
    const targetFolder = folder || this.defaultFolder;
    const originalData = await this.read<T>(originalId, targetFolder);

    if (!originalData) {
      throw new Error(`Record with id ${originalId} not found`);
    }

    const duplicateId = newId || this.generateId();
    const now = new Date();

    const duplicatedRecord: T = {
      ...originalData,
      id: duplicateId,
      createdAt: now,
      updatedAt: now,
    } as T;

    await this.jsonFileManager.createFile(
      targetFolder,
      duplicateId,
      duplicatedRecord
    );
    return duplicatedRecord;
  }

  /**
   * Переименовывает файл (изменяет id)
   */
  async rename<T extends DataRecord>(
    oldId: string,
    newId: string,
    folder?: string
  ): Promise<T> {
    const targetFolder = folder || this.defaultFolder;
    const existingData = await this.read<T>(oldId, targetFolder);

    if (!existingData) {
      throw new Error(`Record with id ${oldId} not found`);
    }

    const renamedRecord: T = {
      ...existingData,
      id: newId,
      updatedAt: new Date(),
    } as T;

    await this.jsonFileManager.renameFile(targetFolder, oldId, newId);
    await this.jsonFileManager.editFile(targetFolder, newId, renamedRecord);

    return renamedRecord;
  }

  /**
   * Получает все файлы в папке (требует дополнительной реализации в JsonFileManager)
   */
  async list<T extends DataRecord>(folder?: string): Promise<T[]> {
    // Эта функция требует дополнительной реализации в JsonFileManager
    // для получения списка всех файлов в папке
    throw new Error(
      "List functionality not implemented yet. Requires JsonFileManager extension."
    );
  }

  /**
   * Генерирует уникальный ID
   */
  private generateId(): string {
    return uuidv4();
  }
}
