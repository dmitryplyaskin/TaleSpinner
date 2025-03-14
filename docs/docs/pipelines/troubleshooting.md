---
sidebar_position: 5
---

# Устранение неполадок

В этом разделе описаны типичные проблемы, с которыми можно столкнуться при работе с пайплайнами, и способы их решения.

## Распространенные проблемы

### Пайплайны не выполняются

**Возможные причины:**

- Опция "Enable pipelines" не включена в глобальных настройках
- Конкретный пайплайн не включен (опция "Enable Pipeline")
- Ошибка в промпте пайплайна

**Решение:**

1. Проверьте, включена ли опция "Enable pipelines"
2. Убедитесь, что пайплайн включен
3. Проверьте промпт на наличие ошибок
4. Попробуйте запустить пайплайн отдельно с помощью кнопки "Run Pipeline"

### Результаты пайплайна не отображаются в чате

**Возможные причины:**

- Не включена опция "Add to Chat History"
- Не включена опция "Show to User in Chat"
- Выбран неправильный тип вывода (Output Type)

**Решение:**

1. Включите опцию "Add to Chat History"
2. Включите опцию "Show to User in Chat"
3. Убедитесь, что выбран правильный тип вывода (обычно "Assistant")

### Теги не работают

**Возможные причины:**

- Неправильный синтаксис использования тега
- Пайплайн с указанным тегом не выполняется или выполняется после текущего
- Опечатка в имени тега

**Решение:**

1. Проверьте синтаксис: `{{tag}}`
2. Убедитесь, что пайплайн с тегом выполняется перед текущим (находится выше в списке)
3. Проверьте правильность написания тега

### Циклические зависимости

**Проблема:** Пайплайны ссылаются друг на друга, создавая бесконечный цикл.

**Решение:**

1. Проверьте зависимости между пайплайнами
2. Убедитесь, что нет циклических ссылок
3. Реорганизуйте пайплайны так, чтобы они выполнялись в правильном порядке

## Советы по отладке

### Изолированное тестирование

Тестируйте каждый пайплайн по отдельности с помощью кнопки "Run Pipeline", чтобы убедиться, что он работает корректно.

### Постепенное добавление

При создании сложных цепочек пайплайнов добавляйте их постепенно, проверяя работу после каждого добавления.

### Логирование

Используйте промежуточные пайплайны для логирования состояния:

- Создайте пайплайн с типом "System"
- Включите опцию "Add to Chat History"
- Включите опцию "Show to User in Chat"
- В промпте используйте теги других пайплайнов для отображения их результатов

### Упрощение

Если сложная цепочка пайплайнов не работает, упростите ее до минимума и постепенно добавляйте сложность, отслеживая, на каком этапе возникает проблема.

## Ограничения и известные проблемы

- **Порядок выполнения:** Пайплайны выполняются строго в порядке сверху вниз в рамках своего типа обработки
- **Производительность:** Большое количество пайплайнов может замедлить работу приложения
- **Контекстное окно:** Помните о ограничениях контекстного окна языковой модели при создании сложных цепочек пайплайнов
- **Конфликты настроек:** Некоторые комбинации настроек могут приводить к неожиданным результатам
