import { describe, expect, it } from 'vitest';

import { computeOperationAutoLayout } from './layout';

describe('node editor auto layout', () => {
	it('places dependencies from left to right', async () => {
		const positions = await computeOperationAutoLayout({
			nodes: [
				{ id: 'source', width: 260, height: 80 },
				{ id: 'middle', width: 260, height: 80 },
				{ id: 'target', width: 260, height: 80 },
			],
			edges: [
				{ source: 'source', target: 'middle' },
				{ source: 'middle', target: 'target' },
			],
		});

		expect(positions.source.x).toBeLessThan(positions.middle.x);
		expect(positions.middle.x).toBeLessThan(positions.target.x);
	});

	it('keeps branch targets separated by node height', async () => {
		const positions = await computeOperationAutoLayout({
			nodes: [
				{ id: 'guard', width: 260, height: 160 },
				{ id: 'battle', width: 260, height: 80 },
				{ id: 'night', width: 260, height: 80 },
			],
			edges: [
				{ source: 'guard', target: 'battle' },
				{ source: 'guard', target: 'night' },
			],
		});

		expect(positions.guard.x).toBeLessThan(positions.battle.x);
		expect(positions.guard.x).toBeLessThan(positions.night.x);
		expect(Math.abs(positions.battle.y - positions.night.y)).toBeGreaterThanOrEqual(104);
	});

	it('keeps disconnected nodes in stable order', async () => {
		const positions = await computeOperationAutoLayout({
			nodes: [
				{ id: 'first', width: 260, height: 80 },
				{ id: 'second', width: 260, height: 80 },
				{ id: 'third', width: 260, height: 80 },
			],
			edges: [],
		});

		expect(positions.first.y).toBeLessThan(positions.second.y);
		expect(positions.second.y).toBeLessThan(positions.third.y);
	});

	it('returns finite deterministic positions for cycles', async () => {
		const input = {
			nodes: [
				{ id: 'a', width: 260, height: 80 },
				{ id: 'b', width: 260, height: 80 },
				{ id: 'c', width: 260, height: 80 },
			],
			edges: [
				{ source: 'a', target: 'b' },
				{ source: 'b', target: 'c' },
				{ source: 'c', target: 'a' },
			],
		};

		const first = await computeOperationAutoLayout(input);
		const second = await computeOperationAutoLayout(input);

		expect(Object.keys(first).sort()).toEqual(['a', 'b', 'c']);
		for (const position of Object.values(first)) {
			expect(Number.isFinite(position.x)).toBe(true);
			expect(Number.isFinite(position.y)).toBe(true);
		}
		expect(second).toEqual(first);
	});
});
