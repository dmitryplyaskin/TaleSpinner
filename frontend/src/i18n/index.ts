import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Импорт переводов
import enCommon from '../locales/en/common.json';
import ruCommon from '../locales/ru/common.json';
import enWorldCreation from '../locales/en/world-creation.json';
import ruWorldCreation from '../locales/ru/world-creation.json';

// Ресурсы переводов
const resources = {
	en: {
		common: enCommon,
		worldCreation: enWorldCreation,
	},
	ru: {
		common: ruCommon,
		worldCreation: ruWorldCreation,
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
	ns: ['common', 'worldCreation'],

	// Настройки отладки
	debug: process.env.NODE_ENV === 'development',
});

export default i18n;
