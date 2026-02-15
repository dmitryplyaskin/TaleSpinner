const explicitBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();

export const BASE_URL =
	explicitBackendUrl && explicitBackendUrl.length > 0
		? explicitBackendUrl
		: import.meta.env.DEV
			? 'http://localhost:5000/api'
			: '/api';
