export type OperationListLayout = {
	paneClassName: string;
	listClassName: string;
	scrollAreaClassName: string;
};

const BASE_PANE_CLASS_NAME = 'op-listPane';
const BASE_LIST_CLASS_NAME = 'op-focusRing op-listLayout';
const BASE_SCROLL_AREA_CLASS_NAME = 'op-listScrollArea';

export function getOperationListLayout(isSplitLayout: boolean): OperationListLayout {
	return {
		paneClassName: isSplitLayout ? `${BASE_PANE_CLASS_NAME} op-stickyPane` : BASE_PANE_CLASS_NAME,
		listClassName: BASE_LIST_CLASS_NAME,
		scrollAreaClassName: isSplitLayout ? `${BASE_SCROLL_AREA_CLASS_NAME} op-listScrollArea--fill` : BASE_SCROLL_AREA_CLASS_NAME,
	};
}
