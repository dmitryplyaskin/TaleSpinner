type DrawerPresentationInput = {
	drawerWidth: number | string;
	fullScreen: boolean;
	fullscreenContentMaxWidth: number;
	placement: 'start' | 'end';
};

type DrawerPresentation = {
	frameClassName: string;
	containerClassName: string;
	containerStyle: Record<string, number | string>;
	shellContentClassName: string;
	modalContentClassName: string;
	modalBodyClassName: string;
	withOverlay: boolean;
};

export function getFullscreenSidebarPresentation(fullscreenContentMaxWidth: number): DrawerPresentation {
	return {
		frameClassName: 'ts-sidebar-frame ts-sidebar-frame--fullscreen',
		containerClassName: 'ts-sidebar-container ts-sidebar-container--fullscreen',
		containerStyle: { maxWidth: fullscreenContentMaxWidth },
		shellContentClassName: '',
		modalContentClassName: 'ts-sidebar-modal-content ts-sidebar-modal-content--fullscreen',
		modalBodyClassName: 'ts-sidebar-modal-body ts-sidebar-modal-body--fullscreen',
		withOverlay: true,
	};
}

export function getDrawerPresentation({
	drawerWidth,
	fullScreen,
	fullscreenContentMaxWidth,
	placement,
}: DrawerPresentationInput): DrawerPresentation {
	if (fullScreen) {
		return getFullscreenSidebarPresentation(fullscreenContentMaxWidth);
	}

	return {
		frameClassName: `ts-sidebar-frame ts-sidebar-frame--drawer ts-sidebar-frame--${placement}`,
		containerClassName: 'ts-sidebar-container ts-sidebar-container--drawer',
		containerStyle: { width: drawerWidth },
		shellContentClassName: 'ts-sidebar-shell__content--edge-scrollbar',
		modalContentClassName: 'ts-sidebar-modal-content ts-sidebar-modal-content--drawer',
		modalBodyClassName: 'ts-sidebar-modal-body ts-sidebar-modal-body--drawer',
		withOverlay: false,
	};
}
