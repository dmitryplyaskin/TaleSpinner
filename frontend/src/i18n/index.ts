import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Импорт переводов
import enCommon from '../locales/en/common.json';
import ruCommon from '../locales/ru/common.json';

// Ресурсы переводов
const resources = {
	en: {
		common: enCommon,
	},
	ru: {
		common: ruCommon,
	},
};

i18n.use(initReactI18next).init({
	resources,
	lng: 'ru', // язык по умолчанию
	fallbackLng: 'en', // резервный язык

	// Настройки интерполяции
	interpolation: {
		escapeValue: false, // не нужно для React
	},

	// Настройки пространств имен
	defaultNS: 'common',
	ns: ['common'],

	// Настройки отладки
	debug: process.env.NODE_ENV === 'development',
});

export default i18n;
