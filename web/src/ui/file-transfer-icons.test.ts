import { LuDownload, LuUpload } from 'react-icons/lu';
import { describe, expect, it } from 'vitest';

import { getFileTransferIcon } from './file-transfer-icons';

describe('getFileTransferIcon', () => {
	it('uses the incoming icon for imports', () => {
		expect(getFileTransferIcon('import')).toBe(LuDownload);
	});

	it('uses the outgoing icon for exports', () => {
		expect(getFileTransferIcon('export')).toBe(LuUpload);
	});
});
