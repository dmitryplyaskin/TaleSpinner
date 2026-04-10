import { describe, expect, it } from 'vitest';

import { getOperationListLayout } from './operation-list-layout';

describe('operation-list-layout', () => {
	it('enables sticky pane classes for split layout', () => {
		expect(getOperationListLayout(true)).toEqual({
			paneClassName: 'op-listPane op-stickyPane',
			listClassName: 'op-focusRing op-listLayout',
			scrollAreaClassName: 'op-listScrollArea op-listScrollArea--fill',
		});
	});

	it('keeps the default scroll area classes for stacked layout', () => {
		expect(getOperationListLayout(false)).toEqual({
			paneClassName: 'op-listPane',
			listClassName: 'op-focusRing op-listLayout',
			scrollAreaClassName: 'op-listScrollArea',
		});
	});
});
