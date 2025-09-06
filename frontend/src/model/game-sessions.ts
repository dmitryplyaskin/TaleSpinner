import { createStore, createEffect } from 'effector';
import { httpClient } from '@utils/api';
import { WorldPrimer } from '@shared/types/world-creation';

export const $gameSessions = createStore<WorldPrimer[]>([]);

export const loadGameSessionsFx = createEffect(async () => {
	const sessions = await httpClient.get<WorldPrimer[]>('/api/game-sessions');
	return sessions;
});

$gameSessions.on(loadGameSessionsFx.doneData, (_, sessions) => sessions);

$gameSessions.watch(console.log);
