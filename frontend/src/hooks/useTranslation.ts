import { useTranslation as useI18nextTranslation } from 'react-i18next';

// Реэкспорт хука с типизацией для нашего проекта
export const useTranslation = (namespace: string = 'common') => {
	return useI18nextTranslation(namespace);
};

// Хук для получения текущего языка
export const useCurrentLanguage = () => {
	const { i18n } = useI18nextTranslation();
	return i18n.language;
};

// Хук для смены языка
export const useLanguageSwitch = () => {
	const { i18n } = useI18nextTranslation();

	const changeLanguage = (lng: string) => {
		i18n.changeLanguage(lng);
	};

	return { changeLanguage, currentLanguage: i18n.language };
};
