import {
  OpenAIService,
  OpenAIServiceConfig,
  ChatCompletionParams,
} from "./openai.service";

// Пример использования OpenAI сервиса

async function examples() {
  // Конфигурация сервиса
  const config: OpenAIServiceConfig = {
    apiKey: process.env.OPENAI_API_KEY || "your-api-key",
    baseURL: "https://api.openai.com/v1", // можно изменить для других провайдеров
    timeout: 30000,
    maxRetries: 2,
  };

  // Создание экземпляра сервиса
  const openaiService = new OpenAIService(config, "gpt-4");

  // Проверка работоспособности API
  const isHealthy = await openaiService.checkHealth();
  console.log("API доступен:", isHealthy);

  // Получение списка доступных моделей
  try {
    const models = await openaiService.getAvailableModels();
    console.log("Доступные модели:", models.slice(0, 5)); // показываем первые 5
  } catch (error) {
    console.error("Ошибка получения моделей:", error);
  }

  // 1. ОБЫЧНЫЙ ЗАПРОС (без потока)
  console.log("\n=== ОБЫЧНЫЙ ЗАПРОС ===");

  const messages = [
    openaiService.createMessage(
      "system",
      "Ты полезный помощник, который отвечает кратко и по делу."
    ),
    openaiService.createMessage(
      "user",
      "Объясни что такое TypeScript в двух предложениях."
    ),
  ];

  const completionParams: ChatCompletionParams = {
    messages,
    temperature: 0.7,
    max_tokens: 150,
    model: "gpt-4o-mini", // можно переопределить модель по умолчанию
  };

  try {
    // Создаем AbortController для возможности отмены
    const abortController = new AbortController();

    // Можно отменить запрос через 10 секунд (для примера)
    // setTimeout(() => abortController.abort(), 10000);

    const response = await openaiService.createCompletion(
      completionParams,
      abortController
    );

    console.log("Ответ:", response.content);
    console.log("Модель:", response.model);
    console.log("Токены:", response.usage);
    console.log("Причина завершения:", response.finish_reason);
  } catch (error) {
    console.error("Ошибка обычного запроса:", error);
  }

  // 2. ПОТОКОВЫЙ ЗАПРОС
  console.log("\n=== ПОТОКОВЫЙ ЗАПРОС ===");

  const streamMessages = [
    openaiService.createMessage("system", "Ты креативный писатель."),
    openaiService.createMessage(
      "user",
      "Напиши короткую историю о роботе, который учится дружить."
    ),
  ];

  const streamParams: ChatCompletionParams = {
    messages: streamMessages,
    temperature: 0.8,
    max_tokens: 300,
  };

  try {
    const abortController = new AbortController();

    const streamingResponse = await openaiService.createStreamingCompletion(
      streamParams,
      abortController
    );

    console.log("Получение потокового ответа...");

    // Способ 1: Обработка потока вручную
    let streamContent = "";
    for await (const chunk of streamingResponse.stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        process.stdout.write(delta.content); // выводим по мере получения
        streamContent += delta.content;
      }
    }

    console.log(
      "\n\nПолучен полный потоковый ответ:",
      streamContent.length,
      "символов"
    );
  } catch (error) {
    console.error("Ошибка потокового запроса:", error);
  }

  // 3. ПОТОКОВЫЙ ЗАПРОС С УТИЛИТАРНЫМ МЕТОДОМ
  console.log("\n=== ПОТОКОВЫЙ ЗАПРОС С COLLECTSTREAMCONTENT ===");

  try {
    const abortController = new AbortController();

    const streamingResponse = await openaiService.createStreamingCompletion(
      {
        messages: [
          openaiService.createMessage(
            "user",
            "Расскажи интересный факт о космосе"
          ),
        ],
        temperature: 0.5,
        max_tokens: 100,
      },
      abortController
    );

    // Способ 2: Сбор всего контента сразу
    const result = await openaiService.collectStreamContent(streamingResponse);

    console.log("Собранный контент:", result.content);
    console.log("Модель:", result.model);
    console.log("Использование:", result.usage);
    console.log("Причина завершения:", result.finish_reason);
  } catch (error) {
    console.error("Ошибка сбора потокового контента:", error);
  }

  // 4. РАБОТА С ИНСТРУМЕНТАМИ (TOOLS)
  console.log("\n=== ЗАПРОС С ИНСТРУМЕНТАМИ ===");

  const toolsParams: ChatCompletionParams = {
    messages: [
      openaiService.createMessage("user", "Какая сейчас погода в Москве?"),
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Получить текущую погоду в указанном городе",
          parameters: {
            type: "object",
            properties: {
              city: {
                type: "string",
                description: "Название города",
              },
            },
            required: ["city"],
          },
        },
      },
    ],
    tool_choice: "auto",
  };

  try {
    const response = await openaiService.createCompletion(toolsParams);
    console.log("Ответ с инструментами:", response.content);
  } catch (error) {
    console.error("Ошибка запроса с инструментами:", error);
  }

  // 5. ОБНОВЛЕНИЕ КОНФИГУРАЦИИ
  console.log("\n=== ОБНОВЛЕНИЕ КОНФИГУРАЦИИ ===");

  // Обновляем базовый URL (например, для использования другого провайдера)
  openaiService.updateConfig({
    baseURL: "https://api.openai.com/v1",
    timeout: 45000,
  });

  // Меняем модель по умолчанию
  openaiService.setDefaultModel("gpt-4o");
  console.log("Новая модель по умолчанию:", openaiService.getDefaultModel());

  // 6. ПРИМЕР С JSON РЕЖИМОМ
  console.log("\n=== JSON РЕЖИМ ===");

  try {
    const jsonResponse = await openaiService.createCompletion({
      messages: [
        openaiService.createMessage(
          "system",
          "Ты помощник, который всегда отвечает в формате JSON."
        ),
        openaiService.createMessage(
          "user",
          "Создай профиль персонажа для RPG игры"
        ),
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 200,
    });

    console.log("JSON ответ:", jsonResponse.content);

    // Парсим JSON
    try {
      const parsedJson = JSON.parse(jsonResponse.content);
      console.log("Распарсенный JSON:", parsedJson);
    } catch (parseError) {
      console.error("Ошибка парсинга JSON:", parseError);
    }
  } catch (error) {
    console.error("Ошибка JSON запроса:", error);
  }
}

// Функция для демонстрации отмены запроса
async function abortExample() {
  console.log("\n=== ПРИМЕР ОТМЕНЫ ЗАПРОСА ===");

  const config: OpenAIServiceConfig = {
    apiKey: process.env.OPENAI_API_KEY || "your-api-key",
  };

  const openaiService = new OpenAIService(config);
  const abortController = new AbortController();

  // Отменяем запрос через 2 секунды
  setTimeout(() => {
    console.log("Отменяем запрос...");
    abortController.abort();
  }, 2000);

  try {
    const response = await openaiService.createCompletion(
      {
        messages: [
          openaiService.createMessage(
            "user",
            "Напиши очень длинную историю на 1000 слов"
          ),
        ],
        max_tokens: 2000,
      },
      abortController
    );

    console.log("Ответ получен:", response.content.substring(0, 100) + "...");
  } catch (error) {
    console.log("Запрос был отменен:", error);
  }
}

// Экспортируем примеры для использования
export { examples, abortExample };

// Если файл запускается напрямую, выполняем примеры
if (require.main === module) {
  examples().catch(console.error);
}
