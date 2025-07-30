import { httpClient } from '@utils/api';
import { createEffect, createStore, sample } from 'effector';
import { WorldCreateTask } from '@shared/types/world';
import { ROUTES, navigateToScreen } from './navigation';

export interface World {
	id: number;
	title: string;
	genre: string;
	tone: string[];
	unique_feature: string;
	synopsis: string;
	isFavorite?: boolean;
}

export const createWorldFx = createEffect({
	handler: async (data: WorldCreateTask) => {
		const world = (await httpClient.post('/api/world/create', data)) as { worlds: World[] };
		return world;
	},
});

export const createMoreWorldsFx = createEffect({
	handler: async (data: WorldCreateTask) => {
		const world = (await httpClient.post('/api/world/create/more', data)) as { worlds: World[] };
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

export const $worlds = createStore<World[]>([]);
$worlds
	.on(createWorldFx.done, (_, { result }) => result.worlds)
	.on(createMoreWorldsFx.done, (state, { result }) => [...state, ...result.worlds]);
