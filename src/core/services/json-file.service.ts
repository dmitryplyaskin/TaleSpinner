import {
  BaseFileData,
  CreateFileOptions,
  UpdateOptions,
  FileInfo,
} from "@shared/types/base-file";
import { glob } from "glob";
import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

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

    if (await this.fileExists(filepath)) {
      if (options.skipIfExists) {
        return (await this.readFile(filename)) as BaseFileData & T;
      }
      if (!options.overwrite) {
        throw new Error(`File ${filename}.json already exists`);
      }
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

  async createDirectory(identifier: string): Promise<boolean> {
    const dirPath = path.join(this.basePath, identifier);
    await this.ensureDirectoryExists(dirPath);
    return true;
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

  async findFilesByPath(pattern: string): Promise<(BaseFileData & T)[]> {
    // Создаем полный путь для поиска, объединяя базовый путь сервиса и паттерн
    const fullPattern = path.join(this.basePath, pattern).replace(/\\/g, "/"); // Нормализуем слеши для glob

    try {
      // Ищем все файлы, соответствующие паттерну
      const matchedPaths = await glob(fullPattern, { nodir: true }); // nodir: true чтобы исключить директории из результатов

      // Параллельно читаем и парсим все найденные файлы
      const readPromises = matchedPaths.map(async (filepath) => {
        try {
          const content = await fs.readFile(filepath, "utf8");
          return JSON.parse(content) as BaseFileData & T;
        } catch (error) {
          // Если отдельный файл не удалось прочитать или распарсить,
          // логируем ошибку и возвращаем null, чтобы не прерывать весь процесс.
          console.error(`Failed to read or parse file at ${filepath}:`, error);
          return null;
        }
      });

      const results = await Promise.all(readPromises);

      // Фильтруем результаты, чтобы убрать null (файлы с ошибками)
      return results.filter((content) => content !== null) as (BaseFileData &
        T)[];
    } catch (error) {
      throw new Error(
        `Failed to find files with pattern "${pattern}": ${
          (error as any).message
        }`
      );
    }
  }

  async deleteDirectory(relativePath: string): Promise<boolean> {
    const dirPath = path.join(this.basePath, relativePath);

    // Проверяем, существует ли такая директория, чтобы не выбрасывать ошибку
    if (!(await this.directoryExists(dirPath))) {
      console.log(`Directory does not exist, nothing to delete: ${dirPath}`);
      return false; // Возвращаем false, так как удаления не было
    }

    try {
      // fs.rm с опцией recursive удаляет папку и все, что в ней есть.
      // force: true - не бросать ошибку, если путь не существует.
      await fs.rm(dirPath, { recursive: true, force: true });
      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete directory ${relativePath}: ${(error as any).message}`
      );
    }
  }
}
