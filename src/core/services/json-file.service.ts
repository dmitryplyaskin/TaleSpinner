import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Базовый тип для данных, хранящихся в JSON файлах
 */
export interface BaseFileData {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

/**
 * Опции для создания файла
 */
export interface CreateFileOptions {
  id?: string;
  filename?: string;
  overwrite?: boolean;
}

/**
 * Информация о файле
 */
export interface FileInfo {
  id: string;
  filename: string;
  filepath: string;
  createdAt: string;
  updatedAt: string;
  size: number;
}

/**
 * Опции для частичного обновления
 */
export interface UpdateOptions {
  merge?: boolean; // true для рекурсивного слияния, false для поверхностного
}

/**
 * Сервис для работы с JSON файлами
 */
export class JsonFileService<
  T extends Record<string, any> = Record<string, any>
> {
  private readonly basePath: string;
  private readonly singleFileName?: string;

  constructor(basePath: string = "./data", singleFileName?: string) {
    this.basePath = path.resolve(basePath);
    this.singleFileName = singleFileName;

    this.initialize();
  }

  /**
   * Инициализация сервиса - создает базовую директорию если её нет
   */
  async initialize(): Promise<void> {
    await this.ensureDirectoryExists(this.basePath);
  }

  /**
   * Создание JSON файла
   */
  async createFile(
    data: Omit<T, "id" | "createdAt" | "updatedAt">,
    options: CreateFileOptions = {}
  ): Promise<BaseFileData & T> {
    const id = options.id || uuidv4();
    const filename = this.singleFileName || options.filename || id;
    const filepath = path.join(this.basePath, `${filename}.json`);

    // Проверяем, существует ли файл
    if (!options.overwrite && (await this.fileExists(filepath))) {
      throw new Error(`File ${filename}.json already exists`);
    }

    const now = new Date().toISOString();
    const fileData: BaseFileData & T = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as BaseFileData & T;

    await this.ensureDirectoryExists(path.dirname(filepath));
    await fs.writeFile(filepath, JSON.stringify(fileData, null, 2), "utf8");

    return fileData;
  }

  /**
   * Чтение JSON файла
   */
  async readFile(identifier: string): Promise<(BaseFileData & T) | null> {
    const filepath = this.getFilePath(identifier);

    if (!(await this.fileExists(filepath))) {
      return null;
    }

    try {
      const content = await fs.readFile(filepath, "utf8");
      return JSON.parse(content) as BaseFileData & T;
    } catch (error) {
      throw new Error(
        `Failed to read file ${identifier}: ${(error as any).message}`
      );
    }
  }

  /**
   * Удаление файла
   */
  async deleteFile(identifier: string): Promise<boolean> {
    const filepath = this.getFilePath(identifier);

    if (!(await this.fileExists(filepath))) {
      return false;
    }

    try {
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete file ${identifier}: ${(error as any).message}`
      );
    }
  }

  /**
   * Полная перезапись файла
   */
  async updateFile(
    identifier: string,
    data: Omit<T, "id" | "createdAt" | "updatedAt">
  ): Promise<(BaseFileData & T) | null> {
    const existingData = await this.readFile(identifier);

    if (!existingData) {
      return null;
    }

    const updatedData: BaseFileData & T = {
      ...data,
      id: existingData.id,
      createdAt: existingData.createdAt,
      updatedAt: new Date().toISOString(),
    } as BaseFileData & T;

    const filepath = this.getFilePath(identifier);
    await fs.writeFile(filepath, JSON.stringify(updatedData, null, 2), "utf8");

    return updatedData;
  }

  /**
   * Частичное обновление файла
   */
  async patchFile(
    identifier: string,
    data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>,
    options: UpdateOptions = { merge: true }
  ): Promise<(BaseFileData & T) | null> {
    const existingData = await this.readFile(identifier);

    if (!existingData) {
      return null;
    }

    let updatedData: BaseFileData & T;

    if (options.merge) {
      // Рекурсивное слияние объектов
      updatedData = this.deepMerge(existingData, {
        ...data,
        updatedAt: new Date().toISOString(),
      }) as BaseFileData & T;
    } else {
      // Поверхностное слияние
      updatedData = {
        ...existingData,
        ...data,
        id: existingData.id,
        createdAt: existingData.createdAt,
        updatedAt: new Date().toISOString(),
      } as BaseFileData & T;
    }

    const filepath = this.getFilePath(identifier);
    await fs.writeFile(filepath, JSON.stringify(updatedData, null, 2), "utf8");

    return updatedData;
  }

  /**
   * Переименование файла
   */
  async renameFile(
    oldIdentifier: string,
    newFilename: string
  ): Promise<boolean> {
    const oldFilepath = this.getFilePath(oldIdentifier);
    const newFilepath = path.join(this.basePath, `${newFilename}.json`);

    if (!(await this.fileExists(oldFilepath))) {
      return false;
    }

    if (await this.fileExists(newFilepath)) {
      throw new Error(`File ${newFilename}.json already exists`);
    }

    try {
      await fs.rename(oldFilepath, newFilepath);

      // Обновляем ID в содержимом файла
      const data = await this.readFile(newFilename);
      if (data) {
        data.id = newFilename;
        data.updatedAt = new Date().toISOString();
        await fs.writeFile(newFilepath, JSON.stringify(data, null, 2), "utf8");
      }

      return true;
    } catch (error) {
      throw new Error(
        `Failed to rename file ${oldIdentifier} to ${newFilename}: ${
          (error as any).message
        }`
      );
    }
  }

  /**
   * Перемещение файла в другую директорию
   */
  async moveFile(identifier: string, newPath: string): Promise<boolean> {
    const oldFilepath = this.getFilePath(identifier);
    const filename = `${identifier}.json`;
    const newFilepath = path.join(path.resolve(newPath), filename);

    if (!(await this.fileExists(oldFilepath))) {
      return false;
    }

    try {
      await this.ensureDirectoryExists(path.dirname(newFilepath));
      await fs.rename(oldFilepath, newFilepath);
      return true;
    } catch (error) {
      throw new Error(
        `Failed to move file ${identifier} to ${newPath}: ${
          (error as any).message
        }`
      );
    }
  }

  /**
   * Получение списка всех файлов в директории
   */
  async getAllFiles(): Promise<FileInfo[]> {
    if (!(await this.directoryExists(this.basePath))) {
      return [];
    }

    try {
      const files = await fs.readdir(this.basePath);
      const jsonFiles = files.filter((file) => path.extname(file) === ".json");

      const fileInfos: FileInfo[] = [];

      for (const file of jsonFiles) {
        const filepath = path.join(this.basePath, file);
        const stats = await fs.stat(filepath);
        const filename = path.basename(file, ".json");

        // Читаем содержимое для получения метаданных
        const content = await this.readFile(filename);

        fileInfos.push({
          id: content?.id || filename,
          filename,
          filepath,
          createdAt: content?.createdAt || stats.birthtime.toISOString(),
          updatedAt: content?.updatedAt || stats.mtime.toISOString(),
          size: stats.size,
        });
      }

      return fileInfos;
    } catch (error) {
      throw new Error(`Failed to get files list: ${(error as any).message}`);
    }
  }

  /**
   * Получение содержимого всех файлов
   */
  async getAllFilesWithContent(): Promise<(BaseFileData & T)[]> {
    const fileInfos = await this.getAllFiles();
    const contents: (BaseFileData & T)[] = [];

    for (const fileInfo of fileInfos) {
      const content = await this.readFile(fileInfo.filename);
      if (content) {
        contents.push(content);
      }
    }

    return contents;
  }

  /**
   * Поиск файлов по критериям
   */
  async findFiles(
    predicate: (data: BaseFileData & T) => boolean
  ): Promise<(BaseFileData & T)[]> {
    const allFiles = await this.getAllFilesWithContent();
    return allFiles.filter(predicate);
  }

  /**
   * Проверка существования файла
   */
  async fileExists(identifier: string): Promise<boolean> {
    const filepath =
      typeof identifier === "string" && identifier.includes(path.sep)
        ? identifier
        : this.getFilePath(identifier);

    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Получение размера файла
   */
  async getFileSize(identifier: string): Promise<number | null> {
    const filepath = this.getFilePath(identifier);

    if (!(await this.fileExists(filepath))) {
      return null;
    }

    try {
      const stats = await fs.stat(filepath);
      return stats.size;
    } catch {
      return null;
    }
  }

  /**
   * Резервное копирование файла
   */
  async backupFile(identifier: string, backupPath?: string): Promise<string> {
    const filepath = this.getFilePath(identifier);

    if (!(await this.fileExists(filepath))) {
      throw new Error(`File ${identifier} does not exist`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = backupPath || path.join(this.basePath, "backups");
    const backupFilepath = path.join(
      backupDir,
      `${identifier}_backup_${timestamp}.json`
    );

    await this.ensureDirectoryExists(backupDir);
    await fs.copyFile(filepath, backupFilepath);

    return backupFilepath;
  }

  /**
   * Валидация JSON файла
   */
  async validateFile(
    identifier: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const data = await this.readFile(identifier);

      if (!data) {
        return { isValid: false, error: "File does not exist" };
      }

      if (!data.id || !data.createdAt || !data.updatedAt) {
        return { isValid: false, error: "Missing required metadata fields" };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: (error as any).message };
    }
  }

  // Приватные методы

  private getFilePath(identifier: string): string {
    if (this.singleFileName) {
      return path.join(this.basePath, `${this.singleFileName}.json`);
    }
    return path.join(this.basePath, `${identifier}.json`);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if ((error as any).code !== "EEXIST") {
        throw new Error(
          `Failed to create directory ${dirPath}: ${(error as any).message}`
        );
      }
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] !== null &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (
          target[key] !== null &&
          typeof target[key] === "object" &&
          !Array.isArray(target[key])
        ) {
          result[key] = this.deepMerge(target[key], source[key]);
        } else {
          result[key] = source[key];
        }
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}

// Пример использования:

/*
// Для множественных файлов
const userService = new JsonFileService<{ name: string; email: string }>('./data/users');

// Для одного конфигурационного файла
const configService = new JsonFileService<{ theme: string; language: string }>('./config', 'app-config');

// Инициализация
await userService.initialize();

// Создание файла
const user = await userService.createFile({ name: 'John', email: 'john@example.com' });

// Чтение
const userData = await userService.readFile(user.id);

// Частичное обновление
await userService.patchFile(user.id, { name: 'John Doe' });

// Получение всех файлов
const allUsers = await userService.getAllFilesWithContent();
*/
