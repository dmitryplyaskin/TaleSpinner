# HITL Interrupt Fix - Исправление проблемы с Human-in-the-Loop

## Проблема

После нажатия кнопки "Анализ" на экране "Опишите ваш мир", запрос отправлялся на сервер, получался ответ, но экран не переключался на следующий шаг. HITL (Human-in-the-Loop) не работал на фронтенде.

## Причина

Архитектурное несоответствие в работе с `interrupt()` в LangGraph:

1. **Как работает LangGraph `interrupt()`**:

   - Когда вызывается `interrupt()`, граф останавливает выполнение
   - Граф ждет возобновления через `Command.resume()`
   - `interrupt()` НЕ сохраняет переданный аргумент в состояние автоматически

2. **Проблема в реализации**:

   - Ноды вызывали `interrupt(clarificationRequest)` напрямую
   - Не устанавливали `pendingClarification` в состоянии перед прерыванием
   - Сервисный слой читал `state.values.pendingClarification` для API ответа
   - Результат: `pendingClarification` был `null/undefined`

3. **Проблема с потоком графа**:

   - Даже если нода возвращала `pendingClarification`, граф переходил к следующему узлу, так как не было условных переходов, проверяющих это поле.

4. **Проблема с идентификацией запроса**:
   - При повторном запуске ноды (после цикла) генерировался новый ID запроса (`uuidv4()`), который не совпадал с ID в `pendingClarification`, из-за чего нода входила в бесконечный цикл генерации новых запросов вместо вызова `interrupt()`.

## Решение

1. **Изменен паттерн работы с `interrupt()` во всех нодах графа**:

   ### Старый паттерн (неправильный)

   ```typescript
   const request = buildQuestionsRequest(questions, outputLanguage);
   const userResponse = interrupt(request) as ClarificationResponse;
   // pendingClarification не установлен в state!
   ```

   ### Новый паттерн (правильный)

   ```typescript
   const request = buildQuestionsRequest(questions, outputLanguage);

   // Проверяем, возобновляемся ли мы после interrupt
   // Используем проверку наличия pendingClarification вместо строгого сравнения ID
   if (state.pendingClarification) {
     // Мы возобновляемся - получаем ответ от interrupt
     // Используем СУЩЕСТВУЮЩИЙ запрос из state для interrupt
     const userResponse = interrupt(
       state.pendingClarification
     ) as ClarificationResponse;
     // Обрабатываем ответ...
   } else {
     // Первый раз попали на interrupt - устанавливаем pendingClarification и возвращаем
     return {
       pendingClarification: request,
       currentNode: "architect",
       // другие поля состояния...
     };
   }
   ```

2. **Обновлено определение графа (`world-generation.graph.ts`)**:
   - Добавлены условные переходы (`addConditionalEdges`) после узлов `architect`, `generateBase` и `reviewWorld`.
   - Эти переходы проверяют `state.pendingClarification`. Если оно установлено, граф возвращается в тот же узел.
   - Это позволяет узлу выполниться повторно, увидеть установленный `pendingClarification` и вызвать `interrupt()`, который корректно приостановит выполнение графа.

## Измененные файлы

### 1. [`architect.node.ts`](src/services/world-creation/graph/nodes/architect.node.ts)

- **Строки 212-239**: Исправлен interrupt для вопросов (убрана проверка ID)
- **Строки 241-293**: Исправлен interrupt для утверждения скелета (убрана проверка ID)

### 2. [`base.node.ts`](src/services/world-creation/graph/nodes/base.node.ts)

- **Строки 39-70**: Исправлен interrupt для уточнения базового мира (убрана проверка ID)

### 3. [`review.node.ts`](src/services/world-creation/graph/nodes/review.node.ts)

- **Строки 116-145**: Исправлен interrupt для разрешения конфликтов (убрана проверка ID)

### 4. [`world-generation.graph.ts`](src/services/world-creation/graph/world-generation.graph.ts)

- Добавлены функции `shouldContinueArchitect`, `shouldContinueBase`.
- Обновлена функция `shouldRefine`.
- Заменены прямые `addEdge` на `addConditionalEdges` для соответствующих узлов.

## Как это работает

### Первый вызов (установка interrupt)

1. Нода генерирует `ClarificationRequest`
2. Проверяет, что `state.pendingClarification` отсутствует.
3. Возвращает частичное состояние с `pendingClarification: request`
4. Граф проверяет условный переход: видит `pendingClarification`, направляет поток обратно в ту же ноду.
5. Нода запускается второй раз.
6. Проверяет, что `state.pendingClarification` присутствует.
7. Вызывает `interrupt(state.pendingClarification)`.
8. LangGraph останавливает выполнение.
9. Сервисный слой читает `state.values.pendingClarification`
10. API возвращает `{"status":"waiting_for_input", "clarification": {...}}`
11. Фронтенд получает `clarification` и переходит на шаг 'questions'

### Возобновление (обработка ответа)

1. Пользователь отправляет ответ через `/continue`
2. Граф возобновляется с `Command.resume(userResponse)`
3. Нода (которая была прервана на `interrupt()`) получает `userResponse`.
4. Обрабатывает ответ и продолжает выполнение.
5. Возвращает состояние с `pendingClarification: null`.
6. Граф проверяет условный переход: `pendingClarification` нет, переходит к следующему узлу.

## Тестирование

Для проверки исправления:

1. Запустить приложение
2. Создать новую сессию создания мира
3. Ввести описание мира
4. Нажать "Анализ"
5. **Ожидаемый результат**:
   - Экран переключается на форму с вопросами
   - Отображается `QuestionForm` с полями из `ClarificationRequest`
   - После ответа на вопросы процесс продолжается

## Дата исправления

2025-11-29
