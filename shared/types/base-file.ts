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
  skipIfExists?: boolean;
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
