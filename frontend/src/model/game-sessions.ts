import { createStore, createEffect } from 'effector';
import { httpClient } from '@utils/api';

export const $gameSessions = createStore<any[]>([]);

export const loadGameSessionsFx = createEffect(async () => {
	const sessions = await httpClient.get<any[]>('/api/game-sessions');
	return sessions;
});

$gameSessions.on(loadGameSessionsFx.doneData, (_, sessions) => sessions);

$gameSessions.watch(console.log);
