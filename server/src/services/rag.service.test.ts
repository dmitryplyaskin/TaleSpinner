import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	axiosGet: vi.fn(),
	getTokenPlaintext: vi.fn(),
	listTokens: vi.fn(),
}));

vi.mock('axios', () => ({
	default: {
		get: mocks.axiosGet,
		post: vi.fn(),
	},
}));

vi.mock('@services/llm/llm-repository', () => ({
	getTokenPlaintext: mocks.getTokenPlaintext,
	listTokens: mocks.listTokens,
}));

import { applyMigrations } from '../db/apply-migrations';
import { initDb, resetDbForTests } from '../db/client';

import {
	ensureRagPresetState,
	getRagProviderConfig,
	getRagRuntime,
	listRagModels,
	patchRagProviderConfig,
	patchRagRuntime,
	ragService,
} from './rag.service';

afterEach(() => {
	vi.restoreAllMocks();
});

beforeEach(() => {
	vi.clearAllMocks();
	vi.spyOn(console, 'warn').mockImplementation(() => undefined);
	mocks.getTokenPlaintext.mockResolvedValue('secret');
	mocks.listTokens.mockResolvedValue([]);
	mocks.axiosGet.mockResolvedValue({
		data: {
			data: [
				{ id: 'm1', name: 'Model 1' },
				{ id: 'm2' },
			],
		},
	});
});

describe('rag service', () => {
	test('listRagModels returns [] for providers without model listing', async () => {
		await expect(listRagModels({ providerId: 'ollama', tokenId: 'tok-1' })).resolves.toEqual([]);
		expect(mocks.axiosGet).not.toHaveBeenCalled();
	});

	test('listRagModels returns [] when token id is missing', async () => {
		await expect(listRagModels({ providerId: 'openrouter', tokenId: null })).resolves.toEqual([]);
		expect(mocks.getTokenPlaintext).not.toHaveBeenCalled();
	});

	test('listRagModels returns [] when plaintext token does not exist', async () => {
		mocks.getTokenPlaintext.mockResolvedValueOnce(null);

		await expect(listRagModels({ providerId: 'openrouter', tokenId: 'missing' })).resolves.toEqual([]);
		expect(mocks.axiosGet).not.toHaveBeenCalled();
	});

	test('listRagModels fetches and maps OpenRouter embedding models', async () => {
		const result = await listRagModels({ providerId: 'openrouter', tokenId: 'tok-1' });

		expect(mocks.axiosGet).toHaveBeenCalledWith('https://openrouter.ai/api/v1/embeddings/models', {
			headers: {
				'HTTP-Referer': 'http://localhost:5000',
				'X-Title': 'TaleSpinner',
				Authorization: 'Bearer secret',
			},
			timeout: 7000,
		});
		expect(result).toEqual([
			{ id: 'm1', name: 'Model 1' },
			{ id: 'm2', name: 'm2' },
		]);
	});

	test('listRagModels returns [] on provider errors', async () => {
		mocks.axiosGet.mockRejectedValueOnce(new Error('network down'));

		await expect(listRagModels({ providerId: 'openrouter', tokenId: 'tok-1' })).resolves.toEqual([]);
	});

	test('ensureRagPresetState creates default preset and repairs settings', async () => {
		vi.spyOn(ragService.presets, 'getAll').mockResolvedValue([]);
		vi.spyOn(ragService.presets, 'create').mockImplementation(async (preset) => preset);
		vi.spyOn(ragService.runtime, 'getConfig').mockResolvedValue({
			activeProviderId: 'openrouter',
			activeTokenId: 'tok-1',
			activeModel: 'openai/text-embedding-3-small',
			activeTokenHint: null,
		});
		vi.spyOn(ragService.providerConfigs, 'getConfig').mockResolvedValue({
			openrouter: { dimensions: 1536, encodingFormat: 'float' },
			ollama: { baseUrl: 'http://localhost:11434' },
		});
		vi.spyOn(ragService.presetSettings, 'getConfig').mockResolvedValue({ selectedId: null, enabled: true } as any);
		const saveSettingsSpy = vi.spyOn(ragService.presetSettings, 'saveConfig').mockImplementation(async (settings) => settings);

		const state = await ensureRagPresetState();

		expect(state.presets).toHaveLength(1);
		expect(state.settings.selectedId).toBe(state.presets[0]?.id ?? null);
		expect(saveSettingsSpy).toHaveBeenCalledWith({ selectedId: state.presets[0]?.id ?? null });
	});

	test('ensureRagPresetState resets selectedId when it points to missing preset', async () => {
		const preset = {
			id: 'preset-1',
			name: 'Preset 1',
			payload: {
				activeProviderId: 'openrouter' as const,
				activeTokenId: null,
				activeModel: null,
				providerConfigsById: {},
			},
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		vi.spyOn(ragService.presets, 'getAll').mockResolvedValue([preset]);
		vi.spyOn(ragService.presetSettings, 'getConfig').mockResolvedValue({ selectedId: 'missing' });
		const saveSettingsSpy = vi.spyOn(ragService.presetSettings, 'saveConfig').mockImplementation(async (settings) => settings);

		const state = await ensureRagPresetState();

		expect(state.settings.selectedId).toBe('preset-1');
		expect(saveSettingsSpy).toHaveBeenCalledWith({ selectedId: 'preset-1' });
	});

	test('db-backed RAG storage initializes defaults and persists runtime/config changes', async () => {
		const prevDataDir = process.env.TALESPINNER_DATA_DIR;
		const tempDir = await mkdtemp(path.join(tmpdir(), 'talespinner-rag-db-'));

		try {
			process.env.TALESPINNER_DATA_DIR = tempDir;
			resetDbForTests();
			await initDb();
			await applyMigrations();

			const state = await ensureRagPresetState();
			expect(state.presets).toHaveLength(1);
			expect(state.settings.selectedId).toBe(state.presets[0]?.id ?? null);

			const runtimeBefore = await getRagRuntime();
			expect(runtimeBefore.activeProviderId).toBe('openrouter');

			await patchRagRuntime({
				activeProviderId: 'ollama',
				activeModel: 'nomic-embed-text',
				activeTokenId: null,
			});
			await patchRagProviderConfig('ollama', {
				baseUrl: 'http://127.0.0.1:11434',
				keepAlive: '10m',
			});

			const runtimeAfter = await getRagRuntime();
			expect(runtimeAfter.activeProviderId).toBe('ollama');
			expect(runtimeAfter.activeModel).toBe('nomic-embed-text');

			const configAfter = await getRagProviderConfig('ollama');
			expect(configAfter.baseUrl).toBe('http://127.0.0.1:11434');
			expect(configAfter.keepAlive).toBe('10m');

			resetDbForTests();
			await initDb();

			const persistedRuntime = await getRagRuntime();
			expect(persistedRuntime.activeProviderId).toBe('ollama');
			expect(persistedRuntime.activeModel).toBe('nomic-embed-text');

			const persistedConfig = await getRagProviderConfig('ollama');
			expect(persistedConfig.baseUrl).toBe('http://127.0.0.1:11434');
			expect(persistedConfig.keepAlive).toBe('10m');
		} finally {
			resetDbForTests();
			if (typeof prevDataDir === 'string') {
				process.env.TALESPINNER_DATA_DIR = prevDataDir;
			} else {
				delete process.env.TALESPINNER_DATA_DIR;
			}
			await rm(tempDir, { recursive: true, force: true });
		}
	});
});
