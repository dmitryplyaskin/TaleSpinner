export const API_BASE_URL = 'http://localhost:5000';

/**
 * Универсальная функция для API запросов
 */
export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
	
	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
		...options,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`HTTP Error ${response.status}: ${errorText}`);
	}

	return response.json();
}

// Универсальные HTTP методы
export const httpClient = {
	get: async <T>(endpoint: string): Promise<T> => {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
		}

		return await response.json();
	},

	post: async <T, D = any>(endpoint: string, data?: D): Promise<T> => {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: data ? JSON.stringify(data) : undefined,
		});

		if (!response.ok) {
			throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
		}

		return await response.json();
	},

	put: async <T, D = any>(endpoint: string, data?: D): Promise<T> => {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: data ? JSON.stringify(data) : undefined,
		});

		if (!response.ok) {
			throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
		}

		return await response.json();
	},

	delete: async <T>(endpoint: string): Promise<T> => {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
		}

		return await response.json();
	},
};
