import { httpClient } from '@utils/api';
import { createEffect, createStore, sample } from 'effector';
import { ROUTES, navigateToScreen } from './navigation';
import { CreatedWorld, WorldCreation, WorldCreateTask } from '@shared/types/world-creation';

export const createWorldFx = createEffect({
	handler: async (data: WorldCreateTask) => {
		const world = (await httpClient.post('/api/world/create', data)) as WorldCreation;
		return world;
	},
});

export const createMoreWorldsFx = createEffect({
	handler: async (data: WorldCreateTask) => {
		const world = (await httpClient.post('/api/world/create/more', data)) as WorldCreation;
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
