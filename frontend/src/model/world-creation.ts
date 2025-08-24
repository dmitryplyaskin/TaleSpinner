import { httpClient } from '@utils/api';
import { createEffect, createStore } from 'effector';

import {
	WorldCreation,
	WorldCreateTask,
	CreatedWorldDraft,
	WorldCustomizationData,
	WorldPrimer,
} from '@shared/types/world-creation';
import { Character, CharacterCreationData } from '@shared/types/character';

export const createDraftWorldsFx = createEffect({
	handler: async (data: WorldCreateTask) => {
		const world = (await httpClient.post('/api/world-creation/create/draft', data)) as WorldCreation;
		return world;
	},
});

export const createMoreWorldsFx = createEffect({
	handler: async (data: WorldCreateTask) => {
		const world = (await httpClient.post('/api/world-creation/create/more', data)) as WorldCreation;
		return world;
	},
});

export const selectWorldFx = createEffect({
	handler: async (data: WorldCreateTask) => {
		const world = (await httpClient.post('/api/world-creation/select', data)) as WorldCreation;
		return world;
	},
});

export const addWorldToFavoritesFx = createEffect({
	handler: async (data: { worldId: string; lastWorldGenerationId: string }) => {
		const world = (await httpClient.post('/api/world-creation/add-to-favorites', data)) as CreatedWorldDraft;
		return world;
	},
});
export const createWorldFx = createEffect({
	handler: async (data: WorldCustomizationData) => {
		const world = (await httpClient.post('/api/world-creation/create-world', data)) as WorldPrimer;
		return world;
	},
});

export const saveCharacterFx = createEffect({
	handler: async (data: CharacterCreationData) => {
		const character = (await httpClient.post('/api/world-creation/save-character', data)) as Character;
		return character;
	},
});

export const $worldCreateProgress = createDraftWorldsFx.pending;
export const $worldCreateMoreProgress = createMoreWorldsFx.pending;
export const $worldCreatePrimerProgress = createWorldFx.pending;
export const $characterSaveProgress = saveCharacterFx.pending;

// sample({
// 	clock: createWorldFx.done,
// 	fn: () => ROUTES.CREATE_WORLD,
// 	target: navigateToScreen,
// });

export const $worlds = createStore<WorldCreation | null>(null);

$worlds
	.on([createDraftWorldsFx.done, createMoreWorldsFx.done], (_, { result }) => result)
	.on(addWorldToFavoritesFx.done, (state, { result }) => {
		if (!state) return null;
		return {
			...state,
			data: state?.data?.map((world) => (world.id === result.id ? { ...world, isFavorite: true } : world)),
		};
	});
