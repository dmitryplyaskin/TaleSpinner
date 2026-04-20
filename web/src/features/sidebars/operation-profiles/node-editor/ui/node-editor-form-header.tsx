import React from 'react';
import { useFormContext, useFormState } from 'react-hook-form';

import { NodeEditorHeader } from './node-editor-header';

import type { OperationProfileFormValues } from '../../form/operation-profile-form-mapping';

type Props = {
	profileName: string;
	isLayoutDirty: boolean;
	onAutoLayout: () => void;
	onSave: () => void;
	onClose: () => void;
	onOpenHelp: () => void;
	isInspectorVisible?: boolean;
	onToggleInspector?: () => void;
	showInspectorToggle?: boolean;
};

export const NodeEditorFormHeader: React.FC<Props> = ({
	profileName,
	isLayoutDirty,
	onAutoLayout,
	onSave,
	onClose,
	onOpenHelp,
	isInspectorVisible,
	onToggleInspector,
	showInspectorToggle,
}) => {
	const { control } = useFormContext<OperationProfileFormValues>();
	const { isDirty: isFormDirty } = useFormState({ control });

	return (
		<NodeEditorHeader
			profileName={profileName}
			isDirty={isLayoutDirty || isFormDirty}
			onAutoLayout={onAutoLayout}
			onSave={onSave}
			onClose={onClose}
			onOpenHelp={onOpenHelp}
			isInspectorVisible={isInspectorVisible}
			onToggleInspector={onToggleInspector}
			showInspectorToggle={showInspectorToggle}
		/>
	);
};
