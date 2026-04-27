import { Button, Paper, Stack } from '@mantine/core';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type FlowPosition = { x: number; y: number };

export type NodeEditorContextMenuState =
	| { type: 'pane'; x: number; y: number; position: FlowPosition }
	| { type: 'node'; x: number; y: number; nodeId: string }
	| { type: 'edge'; x: number; y: number; edgeId: string };

type Props = {
	state: NodeEditorContextMenuState;
	onCreateOperation: () => void;
	onDeleteNode: () => void;
	onDeleteEdge: () => void;
	onInsertOperation: () => void;
};

export const NodeEditorContextMenu: React.FC<Props> = ({
	state,
	onCreateOperation,
	onDeleteNode,
	onDeleteEdge,
	onInsertOperation,
}) => {
	const { t } = useTranslation();

	return (
		<Paper
			withBorder
			shadow="md"
			className="opNodeContextMenu"
			style={{ left: state.x, top: state.y }}
			onContextMenu={(event) => event.preventDefault()}
		>
			{state.type === 'pane' && (
				<Button variant="subtle" size="xs" fullWidth justify="flex-start" onClick={onCreateOperation}>
					{t('operationProfiles.nodeEditor.context.createBlock')}
				</Button>
			)}
			{state.type === 'node' && (
				<Button color="red" variant="subtle" size="xs" fullWidth justify="flex-start" onClick={onDeleteNode}>
					{t('operationProfiles.nodeEditor.context.deleteBlock')}
				</Button>
			)}
			{state.type === 'edge' && (
				<Stack gap={2}>
					<Button color="red" variant="subtle" size="xs" fullWidth justify="flex-start" onClick={onDeleteEdge}>
						{t('operationProfiles.nodeEditor.context.deleteEdge')}
					</Button>
					<Button variant="subtle" size="xs" fullWidth justify="flex-start" onClick={onInsertOperation}>
						{t('operationProfiles.nodeEditor.context.insertBlock')}
					</Button>
				</Stack>
			)}
		</Paper>
	);
};
