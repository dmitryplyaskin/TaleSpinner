# Path Aliases

Конфигурация алиасов для импортов в проекте.

## Backend

**Файл конфигурации:** `tsconfig.json`

### Доступные алиасы

| Алиас | Путь |
|-------|------|
| `@shared/*` | `./shared/*` |
| `@core/*` | `./src/core/*` |
| `@utils/*` | `./src/utils/*` |
| `@types/*` | `./src/types/*` |
| `@services/*` | `./src/services/*` |
| `@api/*` | `./src/api/*` |
| `@schemas/*` | `./src/schemas/*` |

### Runtime резолвинг

Используется `tsconfig-paths/register` в `nodemon.json` для резолвинга алиасов во время выполнения.

## Frontend

**Файл конфигурации:** `frontend/tsconfig.app.json`

### Доступные алиасы

| Алиас | Путь |
|-------|------|
| `@ui/*` | `./src/ui/*` |
| `@types/*` | `./src/types/*` |
| `@model/*` | `./src/model/*` |
| `@shared/*` | `../shared/*` |
| `@utils/*` | `./src/utils/*` |
| `@components/*` | `./src/components/*` |
| `@hooks/*` | `./src/hooks/*` |
| `@theme/*` | `./src/theme/*` |

### Vite резолвинг

Используется плагин `vite-tsconfig-paths` в `frontend/vite.config.ts` для автоматического резолвинга алиасов из tsconfig.

## Примеры использования

```typescript
// Backend
import { LLMService } from "@core/services/llm.service";
import { ApiSettings } from "@shared/types/settings";
import { WorldCreationService } from "@services/world-creation";

// Frontend
import { httpClient } from "@utils/api";
import { $settings } from "@model/settings";
import { WorldPrimer } from "@shared/types/world-creation";
```

