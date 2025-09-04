/**
 * Примеры использования ChatService
 *
 * Этот файл содержит примеры различных способов использования чат сервиса.
 * Используйте эти примеры как отправную точку для интеграции в ваше приложение.
 */

import {
  ChatService,
  ChatHistoryService,
  LoggingMiddleware,
  ContextLimitMiddleware,
  MetadataMiddleware,
} from "./index";

// Пример 1: Простое использование
export async function simpleExample() {
  const chatService = new ChatService();

  try {
    const result = await chatService.sendMessage(
      "Привет! Как дела?",
      "Ты дружелюбный помощник."
    );

    console.log("Ответ:", result.message.content);
    console.log("Использовано токенов:", result.usage?.totalTokens);
  } catch (error) {
    console.error("Ошибка:", error);
  }
}

// Пример 2: Использование с middleware
export async function middlewareExample() {
  const chatService = new ChatService();

  // Добавляем middleware
  chatService.addMiddleware(new LoggingMiddleware());
  chatService.addMiddleware(new ContextLimitMiddleware(2000)); // Лимит 2000 токенов
  chatService.addMiddleware(new MetadataMiddleware({ source: "example" }));

  const result = await chatService.sendMessage("Расскажи короткую историю");
  console.log("История:", result.message.content);
}

// Пример 3: Работа с сессиями и историей
export async function sessionExample() {
  const chatService = new ChatService();
  const historyService = new ChatHistoryService();

  // Создаем новую сессию
  let session = chatService.createSession("Ты помощник по программированию");

  // Ведем диалог
  const { result: firstResult, updatedSession: session1 } =
    await chatService.continueConversation(
      session,
      "Как создать REST API на Node.js?"
    );

  console.log("Первый ответ:", firstResult.message.content);

  // Продолжаем диалог
  const { result: secondResult, updatedSession: session2 } =
    await chatService.continueConversation(
      session1,
      "А как добавить аутентификацию?"
    );

  console.log("Второй ответ:", secondResult.message.content);

  // Сохраняем сессию
  await historyService.saveSession(session2);

  // Получаем статистику
  const stats = await historyService.getHistoryStats();
  console.log("Статистика:", stats);
}

// Пример 4: Потоковый чат
export async function streamingExample() {
  const chatService = new ChatService();

  const messages = [
    chatService.createMessage("system", "Ты креативный писатель"),
    chatService.createMessage("user", "Напиши короткий рассказ про космос"),
  ];

  const streamResult = await chatService.createStreamingCompletion(messages);

  console.log("Получаем потоковый ответ...");

  // Читаем поток по частям
  for await (const chunk of streamResult.stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      process.stdout.write(content);
    }
  }

  console.log("\nПоток завершен");
}

// Пример 5: Использование с кастомными опциями
export async function customOptionsExample() {
  const chatService = new ChatService();

  const result = await chatService.createCompletion(
    [chatService.createMessage("user", "Объясни квантовую физику")],
    {
      temperature: 0.7,
      maxTokens: 500,
      topP: 0.9,
      responseFormat: { type: "text" },
    }
  );

  console.log("Объяснение:", result.message.content);
}

// Пример 6: Обработка ошибок и проверка здоровья API
export async function healthCheckExample() {
  const chatService = new ChatService();

  // Проверяем доступность API
  const isHealthy = await chatService.checkHealth();
  console.log("API доступен:", isHealthy);

  if (isHealthy) {
    // Получаем доступные модели
    const models = await chatService.getAvailableModels();
    console.log("Доступные модели:", models.slice(0, 5)); // Показываем первые 5
  }
}

// Пример 7: Работа с JSON ответами
export async function jsonResponseExample() {
  const chatService = new ChatService();

  const result = await chatService.createCompletion(
    [
      chatService.createMessage(
        "system",
        "Ты возвращаешь ответы только в JSON формате"
      ),
      chatService.createMessage(
        "user",
        "Создай профиль пользователя с именем Алекс"
      ),
    ],
    {
      responseFormat: { type: "json_object" },
      temperature: 0.3,
    }
  );

  try {
    const jsonData = JSON.parse(result.message.content);
    console.log("JSON ответ:", jsonData);
  } catch (error) {
    console.error("Ошибка парсинга JSON:", error);
  }
}
