import { type Node, type ReactFlowInstance } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import { computeBoundsFromNodes } from '../utils/bounds';
import { DEFAULT_GROUP_COLOR_HEX, normalizeCssColorToOpaqueRgbString } from '../utils/color';

import { useGroupLabelDrag } from './use-group-label-drag';

import type { OperationFlowNodeData } from '../flow/operation-flow-node';
import type { GroupEditorDraft } from '../ui/group-editor-modal';
import type { EditorGroup } from '../ui/group-overlays';

type UseNodeEditorGroupsParams = {
	flow: ReactFlowInstance | null;
	nodes: Array<Node<OperationFlowNodeData>>;
	nodesById: Map<string, Node<OperationFlowNodeData>>;
	nodesRef: React.MutableRefObject<Array<Node<OperationFlowNodeData>>>;
	setNodes: React.Dispatch<React.SetStateAction<Array<Node<OperationFlowNodeData>>>>;
	onDirty: () => void;
};

function normalizeGroups(
	groups: Record<string, EditorGroup>,
	existingIds?: Set<string>,
): Record<string, EditorGroup> {
	const next: Record<string, EditorGroup> = {};
	for (const [groupId, group] of Object.entries(groups)) {
		const name = (group?.name ?? '').trim();
		const nodeIdsRaw = Array.isArray(group?.nodeIds) ? group.nodeIds : [];
		const nodeIds = existingIds ? nodeIdsRaw.filter((id) => existingIds.has(id)) : nodeIdsRaw;
		if (!groupId || !name || nodeIds.length === 0) continue;
		const bg = typeof group?.bg === 'string' && group.bg.trim() ? group.bg.trim() : undefined;
		next[groupId] = { name, nodeIds: [...new Set(nodeIds)], bg };
	}
	return next;
}

function areGroupsEqual(a: Record<string, EditorGroup>, b: Record<string, EditorGroup>): boolean {
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	for (const key of aKeys) {
		const left = a[key];
		const right = b[key];
		if (!left || !right) return false;
		if (left.name !== right.name || (left.bg ?? '') !== (right.bg ?? '')) return false;
		const leftIds = [...new Set(left.nodeIds ?? [])].sort();
		const rightIds = [...new Set(right.nodeIds ?? [])].sort();
		if (leftIds.length !== rightIds.length) return false;
		if (!leftIds.every((id, index) => id === rightIds[index])) return false;
	}
	return true;
}

export function useNodeEditorGroups(params: UseNodeEditorGroupsParams) {
	const { flow, nodes, nodesById, nodesRef, setNodes, onDirty } = params;
	const { t } = useTranslation();
	const [groups, setGroups] = useState<Record<string, EditorGroup>>({});
	const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
	const [groupEditor, setGroupEditor] = useState<GroupEditorDraft | null>(null);
	const prevNodeIdsKeyRef = useRef<string>('');

	const resetGroups = useCallback((nextGroups: Record<string, EditorGroup>) => {
		prevNodeIdsKeyRef.current = '';
		setGroups(nextGroups);
		setSelectedGroupId(null);
		setGroupEditor(null);
	}, []);

	const groupSelectData = useMemo(
		() => Object.entries(groups).map(([value, group]) => ({ value, label: group.name })),
		[groups],
	);

	const computeGroupBounds = useCallback(
		(nodeIds: string[]) => {
			const live: Array<Node<OperationFlowNodeData>> = [];
			for (const nodeId of nodeIds) {
				const node = nodesById.get(nodeId);
				if (node) live.push(node);
			}
			return computeBoundsFromNodes(live);
		},
		[nodesById],
	);

	const openGroupEditor = useCallback(
		(groupId: string) => {
			const group = groups[groupId];
			if (!group) return;
			setSelectedGroupId(groupId);
			setGroupEditor({
				groupId,
				name: (group.name ?? '').trim(),
				bg: typeof group.bg === 'string' ? group.bg : '',
			});
		},
		[groups],
	);

	const groupLabelDrag = useGroupLabelDrag({
		flow,
		groups,
		nodesRef,
		setNodes,
		onSelectGroup: (groupId) => setSelectedGroupId(groupId),
		onOpenGroupEditor: openGroupEditor,
		markLayoutDirty: onDirty,
	});

	const createGroupFromSelection = useCallback(
		(nodeIds: string[]) => {
			const ids = [...new Set(nodeIds)].filter(Boolean);
			if (ids.length < 2) return;
			const suggestedName = t('operationProfiles.nodeEditor.groupNameDefault', { index: Object.keys(groups).length + 1 });
			const name = window.prompt(t('operationProfiles.nodeEditor.groupNamePrompt'), suggestedName);
			if (!name?.trim()) return;
			const groupId = uuidv4();
			setGroups((previous) => ({ ...previous, [groupId]: { name: name.trim(), nodeIds: ids } }));
			setSelectedGroupId(groupId);
			onDirty();
		},
		[groups, onDirty, t],
	);

	const ungroupSelected = useCallback(() => {
		if (!selectedGroupId) return;
		setGroups((previous) => {
			if (!previous[selectedGroupId]) return previous;
			const { [selectedGroupId]: _removed, ...rest } = previous;
			return rest;
		});
		setSelectedGroupId(null);
		setGroupEditor((previous) => (previous?.groupId === selectedGroupId ? null : previous));
		onDirty();
	}, [onDirty, selectedGroupId]);

	const ungroupSelectedAction = useCallback(() => {
		if (!selectedGroupId) return;
		if (!window.confirm(t('operationProfiles.confirm.ungroupSelected'))) return;
		ungroupSelected();
	}, [selectedGroupId, t, ungroupSelected]);

	const deleteGroup = useCallback(
		(groupId: string) => {
			setGroups((previous) => {
				if (!previous[groupId]) return previous;
				const { [groupId]: _removed, ...rest } = previous;
				return rest;
			});
			setSelectedGroupId((previous) => (previous === groupId ? null : previous));
			setGroupEditor(null);
			onDirty();
		},
		[onDirty],
	);

	const saveGroup = useCallback(
		(draft: GroupEditorDraft) => {
			const id = draft.groupId;
			const name = draft.name.trim();
			const bgRaw = draft.bg.trim();
			if (!name) return;
			const bg = normalizeCssColorToOpaqueRgbString(bgRaw, DEFAULT_GROUP_COLOR_HEX);
			setGroups((previous) => {
				const group = previous[id];
				if (!group) return previous;
				return { ...previous, [id]: { ...group, name, bg: bgRaw ? bg : undefined } };
			});
			setGroupEditor(null);
			onDirty();
		},
		[onDirty],
	);

	useEffect(() => {
		if (nodes.length === 0) return;
		const nodeIdsKey = nodes.map((node) => String(node.id)).join('\u001f');
		if (prevNodeIdsKeyRef.current === nodeIdsKey) return;
		prevNodeIdsKeyRef.current = nodeIdsKey;
		const existingIds = new Set(nodes.map((node) => String(node.id)));
		setGroups((previous) => {
			const next = normalizeGroups(previous, existingIds);
			if (areGroupsEqual(previous, next)) return previous;
			onDirty();
			return next;
		});
	}, [nodes, onDirty]);

	useEffect(() => {
		if (selectedGroupId && !groups[selectedGroupId]) setSelectedGroupId(null);
		if (groupEditor && !groups[groupEditor.groupId]) setGroupEditor(null);
	}, [groupEditor, groups, selectedGroupId]);

	return {
		groups,
		resetGroups,
		selectedGroupId,
		setSelectedGroupId,
		groupEditor,
		setGroupEditor,
		groupSelectData,
		computeGroupBounds,
		groupLabelDrag,
		createGroupFromSelection,
		ungroupSelectedAction,
		deleteGroup,
		saveGroup,
	};
}
