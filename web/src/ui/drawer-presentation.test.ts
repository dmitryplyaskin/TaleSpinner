import { describe, expect, it } from 'vitest';

import { getDrawerPresentation, getFullscreenSidebarPresentation } from './drawer-presentation';

describe('drawer-presentation', () => {
	it('returns drawer-aligned presentation when fullscreen is disabled', () => {
		expect(
			getDrawerPresentation({
				drawerWidth: 560,
				fullScreen: false,
				fullscreenContentMaxWidth: 1440,
				placement: 'start',
			}),
		).toEqual({
			frameClassName: 'ts-sidebar-frame ts-sidebar-frame--drawer ts-sidebar-frame--start',
			containerClassName: 'ts-sidebar-container ts-sidebar-container--drawer',
			containerStyle: { width: 560 },
			modalContentClassName: 'ts-sidebar-modal-content ts-sidebar-modal-content--drawer',
			modalBodyClassName: 'ts-sidebar-modal-body ts-sidebar-modal-body--drawer',
			withOverlay: false,
		});
	});

	it('returns centered fullscreen presentation when fullscreen is enabled', () => {
		expect(
			getDrawerPresentation({
				drawerWidth: 560,
				fullScreen: true,
				fullscreenContentMaxWidth: 1440,
				placement: 'end',
			}),
		).toEqual({
			frameClassName: 'ts-sidebar-frame ts-sidebar-frame--fullscreen',
			containerClassName: 'ts-sidebar-container ts-sidebar-container--fullscreen',
			containerStyle: { maxWidth: 1440 },
			modalContentClassName: 'ts-sidebar-modal-content ts-sidebar-modal-content--fullscreen',
			modalBodyClassName: 'ts-sidebar-modal-body ts-sidebar-modal-body--fullscreen',
			withOverlay: true,
		});
	});

	it('returns shared fullscreen modal presentation', () => {
		expect(getFullscreenSidebarPresentation(1320)).toEqual({
			frameClassName: 'ts-sidebar-frame ts-sidebar-frame--fullscreen',
			containerClassName: 'ts-sidebar-container ts-sidebar-container--fullscreen',
			containerStyle: { maxWidth: 1320 },
			modalContentClassName: 'ts-sidebar-modal-content ts-sidebar-modal-content--fullscreen',
			modalBodyClassName: 'ts-sidebar-modal-body ts-sidebar-modal-body--fullscreen',
			withOverlay: true,
		});
	});
});
