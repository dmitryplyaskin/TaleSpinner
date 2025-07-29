import { httpClient } from '@utils/api';
import { createEffect } from 'effector';
import { WorldCreateTask } from '@shared/types/world';

export const createWorldFx = createEffect({
	handler: async (data: WorldCreateTask) => {
		const world = await httpClient.post('/api/world/create', data);
		return world;
	},
});
