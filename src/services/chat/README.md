# Chat Service

Расширяемый сервис для работы с LLM API, поддерживающий различные провайдеры и middleware систему.

## Основные компоненты

### ChatService

Основной класс для работы с chat completions API.

**Ключевые возможности:**

- Поддержка всех основных провайдеров (OpenAI, OpenRouter, Anthropic, Ollama, Custom OpenAI)
- Обычные и потоковые запросы
- Система middleware для расширения функциональности
- Управление сессиями и контекстом
- Автоматическое управление токенами и лимитами
- Отмена запросов

### ChatHistoryService

Сервис для управления историей чатов и сессий.

**Возможности:**

- Сохранение и загрузка сессий
- Управление активной сессией
- Экспорт/импорт истории
- Статистика по использованию
- Очистка истории

### Middleware система

Расширяемая система для добавления функциональности:

- **LoggingMiddleware** - логирование запросов и ответов
- **ContextLimitMiddleware** - ограничение длины контекста
- **MetadataMiddleware** - добавление метаданных к сообщениям
- **ContentFilterMiddleware** - фильтрация контента
- **RetryMiddleware** - базовая логика повторных попыток

## Быстрый старт

```typescript
import { ChatService, LoggingMiddleware } from "@services/chat";

const chatService = new ChatService();

// Добавляем логирование
chatService.addMiddleware(new LoggingMiddleware());

// Простое сообщение
const result = await chatService.sendMessage("Привет!");
console.log(result.message.content);
```

## Расширение функциональности

### Создание кастомного middleware

```typescript
import { ChatMiddleware } from "@services/chat";

class CustomMiddleware implements ChatMiddleware {
  name = "custom";

  async beforeCompletion(messages, options) {
    // Логика перед запросом
    return { messages, options };
  }

  async afterCompletion(result, originalMessages) {
    // Логика после получения ответа
    return result;
  }

  async onError(error, messages, options) {
    // Обработка ошибок
  }
}

chatService.addMiddleware(new CustomMiddleware());
```

### Работа с сессиями

```typescript
import { ChatService, ChatHistoryService } from "@services/chat";

const chatService = new ChatService();
const historyService = new ChatHistoryService();

// Создаем сессию
let session = chatService.createSession("Системный промпт");

// Ведем диалог
const { result, updatedSession } = await chatService.continueConversation(
  session,
  "Пользовательское сообщение"
);

// Сохраняем сессию
await historyService.saveSession(updatedSession);
```

### Потоковые запросы

```typescript
const streamResult = await chatService.createStreamingCompletion(messages);

// Читаем поток
for await (const chunk of streamResult.stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}

// Или собираем весь контент
const fullResult = await streamResult.collectContent();
```

## Архитектура для расширения

Сервис спроектирован с учетом будущего расширения:

1. **Middleware система** - позволяет легко добавлять новую функциональность
2. **Провайдер агностик** - поддержка любых OpenAI-совместимых API
3. **Типизированные интерфейсы** - легкая интеграция и разработка
4. **Модульная структура** - каждый компонент можно использовать отдельно
5. **Расширяемые метаданные** - возможность добавления кастомной информации

## Планируемые расширения

- **RAG интеграция** - поддержка поиска по документам
- **Function calling** - вызов функций через LLM
- **Агенты** - многошаговые задачи с планированием
- **Кэширование** - кэш ответов для оптимизации
- **Аналитика** - детальная статистика использования
- **Шаблоны** - готовые промпты и сценарии
