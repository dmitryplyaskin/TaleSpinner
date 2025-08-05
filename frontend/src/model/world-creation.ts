import { httpClient } from '@utils/api';
import { createEffect, createStore, sample } from 'effector';

import { WorldCreation, WorldCreateTask, CreatedWorldDraft } from '@shared/types/world-creation';

export const createWorldFx = createEffect({
	handler: async (data: WorldCreateTask) => {
		const world = (await httpClient.post('/api/world-creation/create', data)) as WorldCreation;
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

export const $worldCreateProgress = createWorldFx.pending;
export const $worldCreateMoreProgress = createMoreWorldsFx.pending;

// sample({
// 	clock: createWorldFx.done,
// 	fn: () => ROUTES.CREATE_WORLD,
// 	target: navigateToScreen,
// });

export const $worlds = createStore<WorldCreation | null>(null);

$worlds
	.on([createWorldFx.done, createMoreWorldsFx.done], (_, { result }) => result)
	.on(addWorldToFavoritesFx.done, (state, { result }) => {
		if (!state) return null;
		return {
			...state,
			data: state?.data?.map((world) => (world.id === result.id ? { ...world, isFavorite: true } : world)),
		};
	});
