# Типографика TaleSpinner

## Шрифты

Приложение использует Google Fonts с полной поддержкой кириллицы:

| Шрифт | Назначение | Файл |
|-------|------------|------|
| **Cormorant Garamond** | Заголовки (h2-h6) | `frontend/src/theme/typography.ts` |
| **Cormorant SC** | Главные заголовки (h1), капитель | `frontend/src/theme/typography.ts` |
| **Lora** | Основной текст (body1, body2) | `frontend/src/theme/typography.ts` |
| **Alegreya** | Подзаголовки (subtitle1, subtitle2) | `frontend/src/theme/typography.ts` |
| **Alegreya SC** | Кнопки, overline | `frontend/src/theme/typography.ts` |
| **Marck Script** | Декоративные элементы (опционально) | `frontend/src/theme/typography.ts` |

## Подключение шрифтов

Шрифты подключаются в `frontend/index.html` через Google Fonts API.

## Стеки шрифтов

```typescript
// frontend/src/theme/typography.ts

// Основной текст
bodyFontStack = '"Lora", "Cormorant Garamond", Georgia, serif'

// Заголовки
headingFontStack = '"Cormorant Garamond", "Alegreya", Georgia, serif'

// Декоративные заголовки (h1)
displayFontStack = '"Cormorant SC", "Alegreya SC", Georgia, serif'

// Кнопки
buttonFontStack = '"Alegreya SC", "Cormorant SC", Georgia, serif'

// Подзаголовки
subtitleFontStack = '"Alegreya", "Cormorant Garamond", Georgia, serif'
```

## Особенности

- **h1**: uppercase, letter-spacing 0.1em, Cormorant SC
- **h2**: курсив (italic), Cormorant Garamond
- **subtitle1**: курсив, Alegreya
- **button**: uppercase, letter-spacing 0.12em, Alegreya SC

