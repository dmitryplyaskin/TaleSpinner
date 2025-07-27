import { AppSettings } from '../../../shared/types/settings';

export const API_BASE_URL = 'http://localhost:3000';

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
