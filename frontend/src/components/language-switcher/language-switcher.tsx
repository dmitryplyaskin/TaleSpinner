import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
	{ code: 'ru', name: 'Русский' },
	{ code: 'en', name: 'English' },
];

export const LanguageSwitcher: React.FC = () => {
	const { i18n, t } = useTranslation('common');

	const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		i18n.changeLanguage(event.target.value);
	};

	return (
		<div className="language-switcher">
			<label htmlFor="language-select" className="sr-only">
				{t('language.switch')}
			</label>
			<select
				id="language-select"
				value={i18n.language}
				onChange={handleLanguageChange}
				className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				{languages.map((language) => (
					<option key={language.code} value={language.code}>
						{language.name}
					</option>
				))}
			</select>
		</div>
	);
};
