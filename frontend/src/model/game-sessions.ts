import { createStore, createEffect, sample } from 'effector';
import { httpClient } from '@utils/api';
import { SavedWorld } from '@shared/types/saved-world';
import { setSelectedWorldId } from './app-navigation';

export const $savedWorlds = createStore<SavedWorld[]>([]);
export const $selectedWorld = createStore<SavedWorld | null>(null);

export const loadSavedWorldsFx = createEffect(async () => {
	const worlds = await httpClient.get<SavedWorld[]>('/api/worlds');
	return worlds;
});

export const loadWorldByIdFx = createEffect(async (id: string) => {
	const world = await httpClient.get<SavedWorld>(`/api/worlds/${id}`);
	return world;
});

export const deleteWorldFx = createEffect(async (id: string) => {
	await httpClient.delete(`/api/worlds/${id}`);
	return id;
});

export const toggleFavoriteFx = createEffect(async (id: string) => {
	const world = await httpClient.post<SavedWorld>(`/api/worlds/${id}/favorite`);
	return world;
});

$savedWorlds.on(loadSavedWorldsFx.doneData, (_, worlds) => worlds);
$savedWorlds.on(deleteWorldFx.doneData, (state, deletedId) => state.filter((w) => w.id !== deletedId));
$savedWorlds.on(toggleFavoriteFx.doneData, (state, updatedWorld) =>
	state.map((w) => (w.id === updatedWorld.id ? updatedWorld : w))
);

$selectedWorld.on(loadWorldByIdFx.doneData, (_, world) => world);

// Загружаем мир при выборе его ID
sample({
	clock: setSelectedWorldId,
	target: loadWorldByIdFx,
});

// Legacy exports for backwards compatibility
export const $gameSessions = $savedWorlds;
export const loadGameSessionsFx = loadSavedWorldsFx;
