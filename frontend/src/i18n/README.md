# Интернационализация (i18n)

## Структура

```
src/
├── i18n/
│   └── index.ts          # Конфигурация i18n
├── locales/
│   ├── en/
│   │   └── common.json   # Английские переводы
│   └── ru/
│       └── common.json   # Русские переводы
├── hooks/
│   └── useTranslation.ts # Хуки для работы с переводами
└── components/
    └── language-switcher/ # Компонент переключения языка
```

## Использование

### В компонентах

```tsx
import { useTranslation } from '../hooks';

const MyComponent = () => {
	const { t } = useTranslation('common');

	return (
		<div>
			<h1>{t('app.name')}</h1>
			<p>{t('app.welcome')}</p>
		</div>
	);
};
```

### Переключение языка

```tsx
import { LanguageSwitcher } from '../components/language-switcher';

const Header = () => {
	return (
		<header>
			<LanguageSwitcher />
		</header>
	);
};
```

### Добавление новых переводов

1. Добавьте ключи в `locales/en/common.json`
2. Добавьте соответствующие переводы в `locales/ru/common.json`
3. Используйте `t('новый.ключ')` в компонентах

## Настройки

- Язык по умолчанию: русский (`ru`)
- Резервный язык: английский (`en`)
- Пространство имен по умолчанию: `common`
