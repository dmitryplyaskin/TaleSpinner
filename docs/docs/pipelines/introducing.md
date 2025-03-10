---
sidebar_position: 1
---

# Введение в Pipelines

Pipelines (Пайплайны) — это мощный инструмент для создания сложных цепочек обработки запросов к языковым моделям. Они позволяют настраивать многоэтапные процессы генерации текста, управлять потоком данных и создавать более сложные и контролируемые взаимодействия с ИИ.

## Что такое Pipelines?

Pipelines представляют собой последовательность настраиваемых шагов обработки, которые могут включать:

- Предварительную обработку запросов пользователя
- Генерацию промежуточных результатов
- Основную генерацию ответов
- Постобработку сгенерированного текста

Каждый пайплайн имеет свои настройки, промпт и может взаимодействовать с другими пайплайнами через систему тегов.

## Зачем использовать Pipelines?

Pipelines решают несколько важных задач:

1. **Сложная логика обработки**: создание многоэтапных процессов генерации текста
2. **Повторное использование**: возможность использовать результаты одного шага в других
3. **Гибкость**: настройка различных сценариев обработки для разных типов запросов
4. **Контроль**: более точное управление процессом генерации текста

## Основные возможности

- Создание последовательности шагов обработки
- Настройка различных типов обработки (pre-processing, generation, post-processing)
- Система тегов для передачи данных между пайплайнами
- Управление отображением результатов в чате
- Полная замена стандартного процесса генерации на пайплайны

## Когда использовать Pipelines?

Pipelines особенно полезны в следующих сценариях:

- Когда требуется сложная предварительная обработка запросов пользователя
- При необходимости генерации промежуточных результатов
- Для создания более структурированных и предсказуемых ответов
- При работе с многоэтапными диалогами
- Для реализации специфических алгоритмов обработки текста

В следующих разделах мы рассмотрим, как создавать и настраивать пайплайны, а также приведем примеры их использования.
