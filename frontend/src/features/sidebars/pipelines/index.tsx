import React, { useEffect } from 'react';
import { Box, Flex, VStack } from '@chakra-ui/react';
import { Drawer } from '@ui/drawer';
import { LuCopy, LuPlus, LuTrash2 } from 'react-icons/lu';
import { PipelineForm } from './pipeline-form';
import { useUnit } from 'effector-react';
import { createEmptyPipeline, pipelinesModel } from '@model/pipelines';
import { Select } from 'chakra-react-select';
import { IconButtonWithTooltip } from '@ui/icon-button-with-tooltip';
import { PipelineType } from '@shared/types/pipelines';

export const PipelineSidebar: React.FC = () => {
	const pipelines = useUnit(pipelinesModel.$items);
	const settings = useUnit(pipelinesModel.$settings);

	const options = pipelines.map((instr) => ({
		label: instr.name,
		value: instr.id,
	}));

	useEffect(() => {
		pipelinesModel.getItemsFx();
		pipelinesModel.getSettingsFx();
	}, []);

	return (
		<Drawer name="pipeline" title="Pipeline">
			<VStack gap={4} align="stretch">
				<Flex gap={2}>
					<Select
						value={settings?.selectedId ? options.find((instr) => instr.value === settings.selectedId) : null}
						onChange={(selected) => pipelinesModel.updateSettingsFx({ ...settings, selectedId: selected?.value })}
						options={options}
					/>
					<Box display="flex" gap={2} alignSelf="flex-end">
						<IconButtonWithTooltip
							tooltip="Создать инструкцию"
							icon={<LuPlus />}
							aria-label="Create instruction"
							onClick={() => pipelinesModel.createItemFx(createEmptyPipeline())}
						/>
						<IconButtonWithTooltip
							tooltip="Дублировать инструкцию"
							icon={<LuCopy />}
							aria-label="Duplicate instruction"
							disabled={!settings.selectedId}
							onClick={() =>
								pipelinesModel.duplicateItemFx(
									pipelines.find((instr) => instr.id === settings.selectedId) as PipelineType,
								)
							}
						/>
						<IconButtonWithTooltip
							tooltip="Удалить инструкцию"
							icon={<LuTrash2 />}
							aria-label="Delete instruction"
							disabled={!settings.selectedId}
							onClick={() => pipelinesModel.deleteItemFx(settings.selectedId as string)}
						/>
					</Box>
				</Flex>
				{settings.selectedId && <PipelineForm />}
			</VStack>
		</Drawer>
	);
};
