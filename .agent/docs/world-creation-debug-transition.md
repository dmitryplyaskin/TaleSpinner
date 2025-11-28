# Отладка Проблемы с Переходом После Анализа

## Проблема
После нажатия кнопки "Анализировать" на экране "Опишите ваш мир" ничего не происходит - экран не переключается на следующий шаг, хотя запрос отправляется и приходит ответ.

## Внесенные Изменения

### 1. Исправлена логика `sample` в `init.ts` (строка 30)
**Было:**
```typescript
sample({
  clock: analyzeInputFx.doneData,
  source: analyzeInputFx.done,  // ← ПРОБЛЕМА: конфликт clock и source
  fn: ({ params }) => params.sessionId,
  target: startGenerationFx,
});
```

**Стало:**
```typescript
sample({
  clock: analyzeInputFx.done,  // ← Исправлено: используем только clock
  fn: ({ params }) => {
    console.log('[WorldCreation] analyzeInputFx.done, sessionId:', params.sessionId);
    return params.sessionId;
  },
  target: startGenerationFx,
});
```

### 2. Добавлено Логирование

**В `init.ts`:**
- Логирование после `analyzeInputFx.done`
- Логирование при получении `startGenerationFx.doneData`
- Логирование фильтров для переходов на `questions` и `review`
- Логирование при переходах между шагами

**В `stores.ts`:**
- Логирование изменений `$step`
- Логирование обновлений `$clarificationRequest`

## Как Проверить

### Шаг 1: Запуск Dev Server
```bash
cd frontend
npm run dev
```

### Шаг 2: Открыть DevTools
1. Откройте Chrome DevTools (F12)
2. Перейдите на вкладку **Console**
3. Отфильтруйте по `[WorldCreation]`

### Шаг 3: Воспроизвести Проблему
1. Запустите создание мира
2. Выберите жанр (Fantasy)
3. Введите описание мира (минимум 20 символов)
4. Нажмите "Анализировать"

### Шаг 4: Проверить Логи

Ожидаемые логи в консоли:

```
[WorldCreation Store] Step change: setting → input
[WorldCreation] analyzeInputFx.done, sessionId: <UUID>
[WorldCreation] startGenerationFx.doneData: { status: "waiting_for_input", clarification: { ... } }
[WorldCreation Store] startGenerationFx.doneData - clarification: { id: "...", ... }
[WorldCreation] Filter for questions step: true status: waiting_for_input
[WorldCreation] Going to questions step
[WorldCreation Store] Step change: input → questions
```

## Возможные Проблемы и Решения

### Проблема 1: `startGenerationFx` Не Вызывается
**Симптом:** Не видите лог `[WorldCreation] analyzeInputFx.done`

**Причина:** `analyzeInputFx` завершился с ошибкой

**Решение:**
- Проверьте Network tab в DevTools
- Посмотрите на ответ от `/api/world-creation/agent/analyze`

### Проблема 2: `startGenerationFx` Возвращает Неожиданный `status`
**Симптом:** Видите `Filter for questions step: false` и другой status

**Возможные статусы:**
- `"completed"` - генерация сразу завершена (маловероятно)
- `"error"` - ошибка при генерации

**Решение:**
- Проверьте лог `startGenerationFx.doneData` - там будет полный объект ответа
- Посмотрите на логи бекенда
- Проверьте что Architect Agent работает корректно

### Проблема 3: Фильтр Не Проходит Из-За Отсутствия `clarification`
**Симптом:** `Filter for questions step: false` но `status: waiting_for_input`

**Причина:** `clarification` в ответе `undefined` или `null`

**Решение:**
- Проверьте бекенд - метод `startGeneration` должен возвращать `clarification` когда `status === "waiting_for_input"`
- Посмотрите в логи Architect Agent

### Проблема 4: Переход Не Происходит Даже При Правильном Фильтре
**Симптом:** Видите `Going to questions step` но шаг не меняется

**Причина:** Проблема с `goToStep` event

**Решение:**
- Проверьте лог `Step change` - он должен появиться после `Going to questions step`
- Если нет - проблема в связи между events в Effector

## Дополнительная Отладка

### Проверка Состояния Stores
Добавьте в консоль браузера:

```javascript
// Получить текущий шаг
$step.getState()

// Получить clarificationRequest
$clarificationRequest.getState()

// Получить sessionId
$sessionId.getState()
```

### Проверка Network
1. DevTools → Network tab
2. Фильтр: `agent`
3. Проверьте запросы:
   - `POST /api/world-creation/agent/analyze` - должен вернуть 200
   - `POST /api/world-creation/agent/generate/:sessionId/start` - должен вернуть 200
4. Посмотрите на Response каждого запроса

## Ожидаемый Результат

После fix:
1. ✅ Нажатие "Анализировать" → загрузка
2. ✅ Запрос к `/analyze` → успешный ответ
3. ✅ Автоматический запрос к `/generate/:sessionId/start`
4. ✅ Получение skeleton от Architect
5. ✅ Автоматический переход на шаг `questions`
6. ✅ Отображение `SkeletonPreview` компонента

## Следующие Шаги

Если проблема не решена:
1. Соберите все логи из консоли
2. Соберите Network requests/responses
3. Проверьте логи бекенда
4. Присылайте полную информацию для дальнейшей отладки
