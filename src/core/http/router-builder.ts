import { Request, Response, Router } from "express";

export interface RouteConfig {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  handler: (req: Request, res: Response) => Promise<void> | void;
  middleware?: Array<(req: Request, res: Response, next: Function) => void>;
}

export class RouterBuilder {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  /**
   * Создает роут на основе конфигурации
   */
  addRoute(config: RouteConfig): this {
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
   * Создает несколько роутов сразу
   */
  addRoutes(configs: RouteConfig[]): this {
    configs.forEach((config) => this.addRoute(config));
    return this;
  }

  /**
   * Возвращает настроенный роутер
   */
  build(): Router {
    return this.router;
  }

  /**
   * Создает базовый CRUD роутер
   */
  addCRUDRoutes(
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
      this.addRoute({
        path: basePath,
        method: "POST",
        handler: handlers.create,
      });
    }

    if (handlers.read) {
      this.addRoute({
        path: `${basePath}/:id`,
        method: "GET",
        handler: handlers.read,
      });
    }

    if (handlers.update) {
      this.addRoute({
        path: `${basePath}/:id`,
        method: "PUT",
        handler: handlers.update,
      });
    }

    if (handlers.delete) {
      this.addRoute({
        path: `${basePath}/:id`,
        method: "DELETE",
        handler: handlers.delete,
      });
    }

    if (handlers.list) {
      this.addRoute({
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
