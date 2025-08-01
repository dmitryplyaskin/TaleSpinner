import { httpClient } from '@utils/api';
import { createEffect, createStore, sample } from 'effector';
import { ROUTES, navigateToScreen } from './navigation';
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
	handler: async (data: CreatedWorldDraft) => {
		const world = (await httpClient.post('/api/world-creation/add-to-favorites', data)) as WorldCreation;
		return world;
	},
});

export const $worldCreateProgress = createWorldFx.pending;
export const $worldCreateMoreProgress = createMoreWorldsFx.pending;

sample({
	clock: createWorldFx.done,
	fn: () => ROUTES.CHOOSE_WORLD,
	target: navigateToScreen,
});

export const $worlds = createStore<WorldCreation | null>(null);
$worlds.on([createWorldFx.done, createMoreWorldsFx.done], (_, { result }) => result);
