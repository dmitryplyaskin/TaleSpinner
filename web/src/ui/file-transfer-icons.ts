import { LuDownload, LuUpload } from 'react-icons/lu';

export type FileTransferAction = 'import' | 'export';

export const IMPORT_FILE_ICON = LuDownload;
export const EXPORT_FILE_ICON = LuUpload;

export function getFileTransferIcon(action: FileTransferAction) {
	return action === 'import' ? IMPORT_FILE_ICON : EXPORT_FILE_ICON;
}
