import { createEffect, createEvent, createStore, sample } from 'effector';

import { apiJson } from '../api/api-json';

import { asyncHandler } from './utils/async-handler';

export type SidebarName =
	| 'settings'
	| 'agentCards'
	| 'userPersons'
	| 'operationProfiles'
	| 'instructions'
	| 'worldInfo'
	| 'appSettings';

export type SidebarSetting = {
	isOpen: boolean;
	isFullscreen: boolean;
	placement: 'start' | 'end';
	size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
	contained?: boolean;
};

export type SidebarSettings = Record<string, SidebarSetting>;

const defaultSidebarSetting: SidebarSetting = {
	isOpen: false,
	isFullscreen: false,
	placement: 'start',
	size: 'lg',
	contained: false,
};

export const defaultSidebars: SidebarSettings = {
	settings: {
		...defaultSidebarSetting,
	},
	agentCards: {
		...defaultSidebarSetting,
	},
	userPersons: {
		...defaultSidebarSetting,
	},
	operationProfiles: {
		...defaultSidebarSetting,
	},
	instructions: {
		...defaultSidebarSetting,
	},
	worldInfo: {
		...defaultSidebarSetting,
	},
	appSettings: {
		...defaultSidebarSetting,
	},
};

const standardSidebarNames = Object.keys(defaultSidebars);

function normalizeLegacySidebarSettings(incoming: SidebarSettings): SidebarSettings {
	const normalized = { ...incoming };
	const appSettings = normalized.appSettings;

	if (appSettings && appSettings.size === 'full' && appSettings.isFullscreen) {
		normalized.appSettings = { ...appSettings, size: 'lg', isFullscreen: false };
	}

	for (const name of standardSidebarNames) {
		const sidebar = normalized[name];
		if (sidebar && sidebar.size !== defaultSidebarSetting.size) {
			normalized[name] = { ...sidebar, size: defaultSidebarSetting.size };
		}
	}

	return normalized;
}

export function mergeSidebarsState(defaults: SidebarSettings, incoming: SidebarSettings): SidebarSettings {
	const normalizedIncoming = normalizeLegacySidebarSettings(incoming);
	const result: SidebarSettings = { ...defaults, ...normalizedIncoming };
	for (const key of Object.keys(result)) {
		const base = defaults[key] ?? defaultSidebarSetting;
		const inc = normalizedIncoming[key] ?? {};
		result[key] = { ...base, ...inc };
	}
	return result;
}

export const $sidebars = createStore<SidebarSettings>(defaultSidebars);

// Dedicated event for changing isOpen.
export const toggleSidebarOpen = createEvent<{ name: SidebarName; isOpen: boolean }>();

// Event for changing settings other than isOpen.
export const changeSidebarSettings = createEvent<{ name: SidebarName; settings: Partial<SidebarSetting> }>();

$sidebars.on(toggleSidebarOpen, (sidebars, { name, isOpen }) => ({
	...sidebars,
	[name]: {
		...(sidebars[name] ?? defaultSidebars[name] ?? defaultSidebarSetting),
		isOpen,
	},
}));

$sidebars.on(changeSidebarSettings, (sidebars, { name, settings }) => {
	// Keep isOpen controlled by toggleSidebarOpen only.
	const { isOpen: _isOpen, ...otherSettings } = settings;

	return {
		...sidebars,
		[name]: {
			...sidebars[name],
			...otherSettings,
		},
	};
});

export const saveSettingsFx = createEffect<SidebarSettings, void>((settings) =>
	asyncHandler(async () => {
		const newSettings = { ...settings };
		Object.keys(newSettings).forEach((key) => {
			newSettings[key as keyof SidebarSettings] = {
				...newSettings[key as keyof SidebarSettings],
				isOpen: false,
			};
		});
		await apiJson<SidebarSettings>('/sidebars', { method: 'POST', body: JSON.stringify(newSettings) });
	}, 'Error saving settings'),
);

export const getSettingsFx = createEffect<void, SidebarSettings>(() =>
	asyncHandler(async () => {
		return apiJson<SidebarSettings>('/sidebars');
	}, 'Error getting settings'),
);

$sidebars.on(getSettingsFx.doneData, (_, payload) => mergeSidebarsState(defaultSidebars, payload));

sample({
	clock: changeSidebarSettings,
	source: $sidebars,
	target: saveSettingsFx,
});
