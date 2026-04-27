import { Group, ScrollArea, Stack, Text } from '@mantine/core';
import React from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { OperationEditor } from '../../ui/operation-editor/operation-editor';

import type { OperationProfileFormValues } from '../../form/operation-profile-form-mapping';
import type { OperationKind } from '@shared/types/operation-profiles';

type Props = {
	selectedIndex: number | null;
	selectedOpId: string | null;
	selectedKind: OperationKind;
	isCompactLayout: boolean;
	isLayoutDirty: boolean;
	onSave: () => void;
	onDiscard: () => void;
	onRemove: () => void;
};

export const NodeEditorInspectorPanel: React.FC<Props> = ({
	selectedIndex,
	selectedOpId,
	selectedKind,
	isCompactLayout,
	isLayoutDirty,
	onSave,
	onDiscard,
	onRemove,
}) => {
	const { t } = useTranslation();
	const { control } = useFormContext<OperationProfileFormValues>();
	const { isDirty: isFormDirty } = useFormState({ control });
	const isDirty = isLayoutDirty || isFormDirty;

	return (
		<ScrollArea className="opNodePanel" style={{ width: isCompactLayout ? '100%' : 480, height: '100%' }} p="md">
			<Stack gap="md" className="opNodeInspector">
				<div className="opNodeInspectorHeader">
					<Group justify="space-between" wrap="nowrap">
						<Text fw={800}>{t('operationProfiles.operationEditor.title')}</Text>
						<Text size="xs" c="dimmed">
							{selectedIndex === null ? '—' : `#${selectedIndex + 1}`}
						</Text>
					</Group>
				</div>

				{selectedIndex === null ? (
					<Text size="sm" c="dimmed">
						{t('operationProfiles.nodeEditor.selectNode')}
					</Text>
				) : (
					<OperationEditor
						key={selectedOpId ?? String(selectedIndex)}
						index={selectedIndex}
						status={{
							index: selectedIndex + 1,
							kind: selectedKind,
							isDirty,
						}}
						canSave={isDirty}
						canDiscard={isDirty}
						onSave={onSave}
						onDiscard={onDiscard}
						onRemove={onRemove}
					/>
				)}
			</Stack>
		</ScrollArea>
	);
};
