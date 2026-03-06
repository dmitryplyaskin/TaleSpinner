import { Group, Select, Stack, Text } from '@mantine/core';
import { LuCopy, LuPencil, LuPlus, LuSave, LuTrash2 } from 'react-icons/lu';

import { IconButtonWithTooltip } from '@ui/icon-button-with-tooltip';

type PresetOption = {
	value: string;
	label: string;
};

type PresetControlsLabels = {
	title: string;
	active: string;
	create: string;
	rename: string;
	duplicate: string;
	save: string;
	delete: string;
};

type Props = {
	labels: PresetControlsLabels;
	options: PresetOption[];
	value: string | null;
	onChange: (value: string | null) => void;
	onCreate: () => void;
	onRename: () => void;
	onDuplicate: () => void;
	onSave: () => void;
	onDelete: () => void;
	disableRename?: boolean;
	disableDuplicate?: boolean;
	disableSave?: boolean;
	disableDelete?: boolean;
};

export const PresetControls: React.FC<Props> = ({
	labels,
	options,
	value,
	onChange,
	onCreate,
	onRename,
	onDuplicate,
	onSave,
	onDelete,
	disableRename = false,
	disableDuplicate = false,
	disableSave = false,
	disableDelete = false,
}) => {
	return (
		<Stack gap="xs">
			<Text fw={600}>{labels.title}</Text>
			<Group align="flex-end">
				<Select
					style={{ flex: 1 }}
					label={labels.active}
					data={options}
					value={value}
					onChange={(nextValue) => onChange(nextValue ?? null)}
					allowDeselect={false}
					comboboxProps={{ withinPortal: false }}
				/>
				<Group gap="xs" pb={4}>
					<IconButtonWithTooltip icon={<LuPlus />} tooltip={labels.create} aria-label={labels.create} onClick={onCreate} />
					<IconButtonWithTooltip icon={<LuPencil />} tooltip={labels.rename} aria-label={labels.rename} onClick={onRename} disabled={disableRename} />
					<IconButtonWithTooltip
						icon={<LuCopy />}
						tooltip={labels.duplicate}
						aria-label={labels.duplicate}
						onClick={onDuplicate}
						disabled={disableDuplicate}
					/>
					<IconButtonWithTooltip
						icon={<LuSave />}
						tooltip={labels.save}
						aria-label={labels.save}
						onClick={onSave}
						disabled={disableSave}
						variant="solid"
					/>
					<IconButtonWithTooltip icon={<LuTrash2 />} tooltip={labels.delete} aria-label={labels.delete} onClick={onDelete} disabled={disableDelete} />
				</Group>
			</Group>
		</Stack>
	);
};
