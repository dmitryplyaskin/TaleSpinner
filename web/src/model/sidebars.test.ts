import { describe, expect, it } from 'vitest';

import { defaultSidebars, mergeSidebarsState, type SidebarSettings } from './sidebars';

describe('sidebars model', () => {
	it('normalizes persisted standard drawer sizes to the shared default width', () => {
		const incoming: SidebarSettings = {
			instructions: {
				isOpen: false,
				isFullscreen: false,
				placement: 'start',
				size: 'md',
				contained: false,
			},
			agentCards: {
				isOpen: false,
				isFullscreen: true,
				placement: 'end',
				size: 'xl',
				contained: false,
			},
		};

		const merged = mergeSidebarsState(defaultSidebars, incoming);

		expect(merged.instructions.size).toBe('lg');
		expect(merged.agentCards.size).toBe('lg');
		expect(merged.agentCards.isFullscreen).toBe(true);
	});
});
