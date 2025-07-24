import { Request, Response, Router } from "express";

export interface EndpointConfig {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  handler: (req: Request, res: Response) => Promise<void> | void;
  middleware?: Array<(req: Request, res: Response, next: Function) => void>;
}

export class EndpointFactory {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  /**
   * Создает энпоинт на основе конфигурации
   */
  createEndpoint(config: EndpointConfig): this {
    const { path, method, handler, middleware = [] } = config;

    // Применяем middleware если есть
    switch (method.toLowerCase()) {
      case "get":
        this.router.get(path, ...middleware, handler);
        break;
      case "post":
        this.router.post(path, ...middleware, handler);
        break;
      case "put":
        this.router.put(path, ...middleware, handler);
        break;
      case "delete":
        this.router.delete(path, ...middleware, handler);
        break;
      case "patch":
        this.router.patch(path, ...middleware, handler);
        break;
    }

    return this;
  }

  /**
   * Создает несколько энпоинтов сразу
   */
  createEndpoints(configs: EndpointConfig[]): this {
    configs.forEach((config) => this.createEndpoint(config));
    return this;
  }

  /**
   * Возвращает настроенный роутер
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Создает базовый CRUD энпоинт
   */
  createCRUDEndpoint(
    basePath: string,
    handlers: {
      create?: (req: Request, res: Response) => Promise<void> | void;
      read?: (req: Request, res: Response) => Promise<void> | void;
      update?: (req: Request, res: Response) => Promise<void> | void;
      delete?: (req: Request, res: Response) => Promise<void> | void;
      list?: (req: Request, res: Response) => Promise<void> | void;
    }
  ): this {
    if (handlers.create) {
      this.createEndpoint({
        path: basePath,
        method: "POST",
        handler: handlers.create,
      });
    }

    if (handlers.read) {
      this.createEndpoint({
        path: `${basePath}/:id`,
        method: "GET",
        handler: handlers.read,
      });
    }

    if (handlers.update) {
      this.createEndpoint({
        path: `${basePath}/:id`,
        method: "PUT",
        handler: handlers.update,
      });
    }

    if (handlers.delete) {
      this.createEndpoint({
        path: `${basePath}/:id`,
        method: "DELETE",
        handler: handlers.delete,
      });
    }

    if (handlers.list) {
      this.createEndpoint({
        path: basePath,
        method: "GET",
        handler: handlers.list,
      });
    }

    return this;
  }

  /**
   * Добавляет middleware ко всем роутам
   */
  addGlobalMiddleware(
    middleware: (req: Request, res: Response, next: Function) => void
  ): this {
    this.router.use(middleware);
    return this;
  }
}
