# Модульный компонент чата TaleSpinner

## Описание

Полностью модульная система чата, выполненная в стиле дизайн-системы world-creation компонентов. Архитектура разбита на логические модули для легкого расширения и поддержки.

## Архитектура

### 📁 Структура файлов

```
chat/
├── components/           # UI компоненты
│   ├── ChatHeader.tsx   # Заголовок с навигацией
│   ├── ChatInput.tsx    # Поле ввода сообщений
│   ├── MessageBubble.tsx # Отдельное сообщение
│   ├── MessagesList.tsx  # Список сообщений с автопрокруткой
│   ├── TypingIndicator.tsx # Индикатор печати
│   └── index.ts         # Экспорты компонентов
├── hooks/               # Бизнес-логика
│   ├── useChat.ts       # Хук управления чатом
│   └── index.ts         # Экспорты хуков
├── data/                # Данные
│   ├── mockData.ts      # Мок-данные
│   └── index.ts         # Экспорты данных
├── types.ts             # TypeScript типы
├── ChatPage.tsx         # Главный компонент
├── index.tsx            # Главный экспорт модуля
└── README.md            # Документация
```

## Компоненты

### `ChatPage`

Главный компонент, собирающий все части вместе.

### `ChatHeader`

- Заголовок с кнопкой "Назад"
- Настраиваемый title и subtitle
- Опциональная навигация

### `MessagesList`

- Отображение списка сообщений
- Автопрокрутка к новым сообщениям
- Поддержка индикатора печати
- Настраиваемое поведение скролла

### `MessageBubble`

- Отображение отдельного сообщения
- Поддержка трех типов: user, ai, system
- Аватары и временные метки
- Адаптивная стилизация

### `ChatInput`

- Многострочное поле ввода
- Поддержка Enter/Shift+Enter
- Кнопка отправки
- Валидация и состояние disabled

### `TypingIndicator`

- Анимированный индикатор печати
- Настраиваемый аватар и имя пользователя

## Хуки

### `useChat(initialMessages?)`

Главный хук для управления состоянием чата:

```tsx
const {
	messages, // Массив сообщений
	isTyping, // Состояние печати
	inputValue, // Текущий ввод
	setInputValue, // Обновление ввода
	sendMessage, // Отправка сообщения
	addMessage, // Добавление сообщения
	clearMessages, // Очистка чата
	resetChat, // Сброс к начальному состоянию
	setIsTyping, // Управление состоянием печати
} = useChat(mockMessages);
```

## Типы

```tsx
interface ChatMessage {
	id: string;
	type: 'user' | 'ai' | 'system';
	content: string;
	timestamp: Date;
	avatar?: string;
	username?: string;
}

interface ChatState {
	messages: ChatMessage[];
	isTyping: boolean;
	inputValue: string;
}
```

## Использование

### Базовое использование

```tsx
import { ChatPage } from './components/chat';

<ChatPage />;
```

### Использование отдельных компонентов

```tsx
import { MessagesList, ChatInput, ChatHeader, useChat } from './components/chat';

const MyCustomChat = () => {
	const { messages, isTyping, inputValue, setInputValue, sendMessage } = useChat();

	return (
		<div>
			<ChatHeader title="Мой чат" onBack={() => console.log('back')} />
			<MessagesList messages={messages} isTyping={isTyping} />
			<ChatInput value={inputValue} onChange={setInputValue} onSend={sendMessage} />
		</div>
	);
};
```

### Кастомизация сообщений

```tsx
import { useChat, MessageBubble } from './components/chat';

const CustomChat = () => {
  const { addMessage } = useChat();

  const handleCustomMessage = () => {
    addMessage({
      id: Date.now().toString(),
      type: 'ai',
      content: 'Кастомное сообщение',
      timestamp: new Date(),
      username: 'Кастомный ИИ'
    });
  };

  return (
    // ваш UI
  );
};
```

## Расширение функциональности

### Добавление новых типов сообщений

1. Обновите тип `ChatMessage` в `types.ts`
2. Добавьте обработку в `MessageBubble.tsx`
3. Обновите логику в `useChat.ts`

### Интеграция с реальным API

1. Создайте новый хук `useApiChat` на базе `useChat`
2. Замените мок-логику на реальные API вызовы
3. Добавьте обработку ошибок и загрузки

### Добавление новых компонентов

1. Создайте компонент в папке `components/`
2. Добавьте экспорт в `components/index.ts`
3. Обновите типы при необходимости

## Особенности

- **Модульность**: Каждый компонент независим и переиспользуем
- **Типизация**: Полная поддержка TypeScript
- **Расширяемость**: Легко добавлять новую функциональность
- **Тестируемость**: Изолированные компоненты и хуки
- **Производительность**: Оптимизированные ре-рендеры
- **Совместимость**: Обратная совместимость с существующим кодом
