---
title: API Overview
sidebar_position: 1
description: Как организован backend API и где искать source of truth.
---

# API Overview

## Где источник правды

1. Монтирование роутов: `server/src/index.ts`
2. Агрегатор основных API роутов: `server/src/api/_routes_.ts`
3. Конкретные обработчики: `server/src/api/**/*.ts`

## Базовый префикс

Основные роутеры из `_routes_.ts` подключаются через:

```ts
app.use('/api', routes)
```

Поэтому endpoint вида `/chats/:id` в router-файле становится `/api/chats/:id`.

## Основные группы API

- chats / branches
- chat entries / variants / streaming
- entity profiles
- llm providers / tokens / runtime / presets
- rag chroma (collections / documents / query / world-info reindex)
- operation profiles
- instructions
- ui themes
- world info
- files

## ChromaDB: режимы подключения

Backend поддерживает два режима:

1. `CHROMA_URL` задан: используется прямое подключение к удаленному/внешнему Chroma.
2. `CHROMA_URL` пустой: URL собирается из `CHROMA_HOST` + `CHROMA_PORT` + `CHROMA_SSL`.

Основные env:

- `CHROMA_URL`
- `CHROMA_HOST`, `CHROMA_PORT`, `CHROMA_SSL`
- `CHROMA_TENANT`, `CHROMA_DATABASE`
- `CHROMA_COLLECTION_WORLD_INFO`
- `CHROMA_DATA_DIR`
- `CHROMA_TIMEOUT_MS`

## ChromaDB: локальный docker запуск

Пример быстрого локального запуска с персистом данных:

```bash
docker run --name talespinner-chroma -p 8000:8000 \
  -v ./data/chroma:/data \
  chromadb/chroma:latest
```

Или через `docker compose`:

```yaml
services:
  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - ./data/chroma:/data
```

После этого можно использовать стандартный backend-конфиг:

- `CHROMA_HOST=127.0.0.1`
- `CHROMA_PORT=8000`
