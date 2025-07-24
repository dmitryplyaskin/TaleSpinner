import { Request, Response } from "express";
import {
  ProgressStep,
  WorldCreateRequest,
  WorldCreateResponse,
} from "../../shared/types/api";

// Заглушка для имитации работы с ЛЛМ
const mockLLMTasks = (
  worldType: string,
  userPrompt?: string
): Promise<any>[] => {
  const baseTasks = [
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            step: "validate-world",
            result: "Параметры мира проверены",
          }),
        1000
      )
    ),
    new Promise((resolve) =>
      setTimeout(
        () => resolve({ step: "create-world", result: "Мир создан" }),
        1500
      )
    ),
  ];

  switch (worldType) {
    case "fantasy":
      return [
        ...baseTasks,
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                step: "generate-magic-system",
                result: "Система магии настроена",
              }),
            2000
          )
        ),
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                step: "create-creatures",
                result: "Существа добавлены",
              }),
            1800
          )
        ),
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                step: "setup-kingdoms",
                result: "Политическая карта настроена",
              }),
            2200
          )
        ),
      ];

    case "cyberpunk":
      return [
        ...baseTasks,
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                step: "setup-corporations",
                result: "Корпорации созданы",
              }),
            1600
          )
        ),
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                step: "generate-tech",
                result: "Технологии настроены",
              }),
            1900
          )
        ),
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({ step: "create-districts", result: "Районы созданы" }),
            1700
          )
        ),
      ];

    case "everyday":
      return [
        ...baseTasks,
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({ step: "setup-locations", result: "Локации настроены" }),
            1400
          )
        ),
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ step: "create-npcs", result: "NPC созданы" }),
            1300
          )
        ),
      ];

    case "custom":
      return [
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                step: "analyze-requirements",
                result: "Требования проанализированы",
              }),
            1200
          )
        ),
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({ step: "design-world", result: "Дизайн мира готов" }),
            1800
          )
        ),
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({ step: "implement-rules", result: "Правила внедрены" }),
            2100
          )
        ),
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ step: "create-content", result: "Контент создан" }),
            2400
          )
        ),
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                step: "finalize-world",
                result: "Мир готов к использованию",
              }),
            1600
          )
        ),
      ];

    default:
      return baseTasks;
  }
};

export const worldCreateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { worldType, userPrompt }: WorldCreateRequest = req.body;

    if (!worldType) {
      res.status(400).json({
        success: false,
        error: "Тип мира обязателен",
      });
      return;
    }

    // Получаем список промисов для обработки
    const llmPromises = mockLLMTasks(worldType, userPrompt);

    // Создаем шаги для прогресса
    const steps: ProgressStep[] = [];

    switch (worldType) {
      case "fantasy":
        steps.push(
          {
            id: "validate-world",
            description: "Проверка параметров мира...",
            completed: false,
          },
          {
            id: "create-world",
            description: "Создание игрового мира...",
            completed: false,
          },
          {
            id: "generate-magic-system",
            description: "Генерация системы магии...",
            completed: false,
          },
          {
            id: "create-creatures",
            description: "Создание мифических существ...",
            completed: false,
          },
          {
            id: "setup-kingdoms",
            description: "Настройка королевств и фракций...",
            completed: false,
          }
        );
        break;
      case "cyberpunk":
        steps.push(
          {
            id: "validate-world",
            description: "Проверка параметров мира...",
            completed: false,
          },
          {
            id: "create-world",
            description: "Создание игрового мира...",
            completed: false,
          },
          {
            id: "setup-corporations",
            description: "Настройка корпораций...",
            completed: false,
          },
          {
            id: "generate-tech",
            description: "Генерация технологий...",
            completed: false,
          },
          {
            id: "create-districts",
            description: "Создание городских районов...",
            completed: false,
          }
        );
        break;
      case "everyday":
        steps.push(
          {
            id: "validate-world",
            description: "Проверка параметров мира...",
            completed: false,
          },
          {
            id: "create-world",
            description: "Создание игрового мира...",
            completed: false,
          },
          {
            id: "setup-locations",
            description: "Настройка локаций...",
            completed: false,
          },
          {
            id: "create-npcs",
            description: "Создание персонажей...",
            completed: false,
          }
        );
        break;
      case "custom":
        steps.push(
          {
            id: "analyze-requirements",
            description: "Анализ требований...",
            completed: false,
          },
          {
            id: "design-world",
            description: "Проектирование мира...",
            completed: false,
          },
          {
            id: "implement-rules",
            description: "Внедрение правил...",
            completed: false,
          },
          {
            id: "create-content",
            description: "Создание контента...",
            completed: false,
          },
          {
            id: "finalize-world",
            description: "Финализация мира...",
            completed: false,
          }
        );
        break;
      default:
        steps.push(
          {
            id: "validate-world",
            description: "Проверка параметров мира...",
            completed: false,
          },
          {
            id: "create-world",
            description: "Создание игрового мира...",
            completed: false,
          }
        );
    }

    // Выполняем все промисы и собираем результаты
    const results = await Promise.all(llmPromises);

    // Помечаем все шаги как выполненные
    steps.forEach((step) => (step.completed = true));

    const response: WorldCreateResponse = {
      success: true,
      steps,
      results,
    };

    res.json(response);
  } catch (error) {
    console.error("Ошибка создания мира:", error);
    res.status(500).json({
      success: false,
      error: "Внутренняя ошибка сервера",
    });
  }
};
