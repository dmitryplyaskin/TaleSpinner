import fs from "fs/promises";
import path from "path";

export class JsonFileManager {
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || "./data";
  }

  private getFilePath(folder: string, fileName: string): string {
    return path.join(this.basePath, folder, `${fileName}.json`);
  }

  async createFile(
    folder: string,
    fileName: string,
    content: object
  ): Promise<void> {
    const filePath = this.getFilePath(folder, fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(content, null, 2), "utf-8");
  }

  async deleteFile(folder: string, fileName: string): Promise<void> {
    const filePath = this.getFilePath(folder, fileName);
    await fs.unlink(filePath);
  }

  async editFile(
    folder: string,
    fileName: string,
    newContent: object
  ): Promise<void> {
    const filePath = this.getFilePath(folder, fileName);
    await fs.writeFile(filePath, JSON.stringify(newContent, null, 2), "utf-8");
  }

  async renameFile(
    folder: string,
    oldName: string,
    newName: string
  ): Promise<void> {
    const oldPath = this.getFilePath(folder, oldName);
    const newPath = this.getFilePath(folder, newName);
    await fs.rename(oldPath, newPath);
  }

  async duplicateFile(
    folder: string,
    originalName: string,
    newName: string
  ): Promise<void> {
    const originalPath = this.getFilePath(folder, originalName);
    const newPath = this.getFilePath(folder, newName);
    await fs.copyFile(originalPath, newPath);
  }

  async getContent(folder: string, fileName: string): Promise<object> {
    const filePath = this.getFilePath(folder, fileName);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  }
}
