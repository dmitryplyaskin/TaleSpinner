import { Group } from '@mantine/core';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCopyPlus, LuPlus, LuTrash2 } from 'react-icons/lu';

import { EXPORT_FILE_ICON, IMPORT_FILE_ICON } from '@ui/file-transfer-icons';
import { IconButtonWithTooltip } from '@ui/icon-button-with-tooltip';
import { toaster } from '@ui/toaster';
import { TOOLTIP_PORTAL_SETTINGS } from '@ui/z-index';

type SelectedProfile = { profileId: string; name: string } | null;
const QUICK_ACTION_TOOLTIP_SETTINGS = TOOLTIP_PORTAL_SETTINGS;

function downloadJson(filename: string, blob: Blob) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

type Props = {
	selected: SelectedProfile;
	onCreate: () => void;
	onDuplicate: (profileId: string) => void;
	onDelete: (profileId: string) => void;
	onExport: (profileId: string) => Promise<{ blob: Blob; filename: string }>;
	onImport: (file: File) => Promise<void>;
};

export const ProfileActions: React.FC<Props> = ({ selected, onCreate, onDuplicate, onDelete, onExport, onImport }) => {
	const { t } = useTranslation();
	const fileInputRef = useRef<HTMLInputElement>(null);

	return (
		<Group gap="xs" wrap="nowrap" className="op-profileActions">
			<IconButtonWithTooltip
				aria-label={t('operationProfiles.actions.createProfile')}
				tooltip={t('operationProfiles.actions.createProfile')}
				icon={<LuPlus />}
				size="input-sm"
				tooltipSettings={QUICK_ACTION_TOOLTIP_SETTINGS}
				onClick={onCreate}
			/>
			<IconButtonWithTooltip
				aria-label={t('operationProfiles.actions.duplicateProfile')}
				tooltip={t('operationProfiles.actions.duplicateProfile')}
				icon={<LuCopyPlus />}
				size="input-sm"
				tooltipSettings={QUICK_ACTION_TOOLTIP_SETTINGS}
				disabled={!selected?.profileId}
				onClick={() => selected?.profileId && onDuplicate(selected.profileId)}
			/>
			<IconButtonWithTooltip
				aria-label={t('operationProfiles.actions.deleteProfile')}
				tooltip={t('operationProfiles.actions.deleteProfile')}
				icon={<LuTrash2 />}
				size="input-sm"
				colorPalette="red"
				tooltipSettings={QUICK_ACTION_TOOLTIP_SETTINGS}
				disabled={!selected?.profileId}
				onClick={() => {
					if (!selected?.profileId) return;
					if (!window.confirm(t('operationProfiles.confirm.deleteProfile'))) return;
					onDelete(selected.profileId);
				}}
			/>

			<IconButtonWithTooltip
				aria-label={t('operationProfiles.actions.exportProfile')}
				tooltip={t('operationProfiles.actions.exportProfile')}
				icon={<EXPORT_FILE_ICON />}
				size="input-sm"
				variant="ghost"
				tooltipSettings={QUICK_ACTION_TOOLTIP_SETTINGS}
				disabled={!selected?.profileId}
				onClick={async () => {
					if (!selected?.profileId) return;
					try {
						const exported = await onExport(selected.profileId);
						downloadJson(exported.filename, exported.blob);
					} catch (e) {
						toaster.error({
							title: t('operationProfiles.toasts.exportError'),
							description: e instanceof Error ? e.message : String(e),
						});
					}
				}}
			/>

			<input
				ref={fileInputRef}
				type="file"
				accept="application/json"
				style={{ display: 'none' }}
				onChange={(e) => {
					const file = e.currentTarget.files?.[0];
					if (!file) return;
					void onImport(file)
						.catch((err) => {
							toaster.error({
								title: t('operationProfiles.toasts.importError'),
								description: err instanceof Error ? err.message : String(err),
							});
						})
						.finally(() => {
							e.currentTarget.value = '';
						});
				}}
			/>

			<IconButtonWithTooltip
				aria-label={t('operationProfiles.actions.importProfiles')}
				tooltip={t('operationProfiles.actions.importProfiles')}
				icon={<IMPORT_FILE_ICON />}
				size="input-sm"
				variant="ghost"
				tooltipSettings={QUICK_ACTION_TOOLTIP_SETTINGS}
				onClick={() => {
					fileInputRef.current?.click();
				}}
			/>
		</Group>
	);
};
