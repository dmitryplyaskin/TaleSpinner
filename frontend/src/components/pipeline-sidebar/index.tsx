import React from 'react';
import { Button, VStack } from '@chakra-ui/react';
import { Drawer } from '@ui/drawer';
import { LuPlus } from 'react-icons/lu';
import { useFieldArray, FormProvider, useForm } from 'react-hook-form';
import { PipelineForm } from './pipeline-form';
import { CustomAutocomplete } from '@ui/custom-autocomplete';

type PipelineFormData = {
	pipelines: Array<{
		name: string;
		description: string;
		enabled: boolean;
	}>;
};

export const PipelineSidebar: React.FC = () => {
	const methods = useForm<PipelineFormData>({
		defaultValues: {
			pipelines: [],
		},
	});

	const { fields, append, remove, move } = useFieldArray({
		control: methods.control,
		name: 'pipelines',
	});

	const handleAddPipeline = () => {
		append({
			name: '',
			description: '',
			enabled: true,
		});
	};

	return (
		<Drawer name="pipeline" title="Pipeline">
			<CustomAutocomplete
				options={[
					{ label: 'Apple', value: 'apple' },
					{ label: 'Banana', value: 'banana' },
					{ label: 'Cherry', value: 'cherry' },
					{ label: 'Date', value: 'date' },
					{ label: 'Elderberry', value: 'elderberry' },
					{ label: 'Fig', value: 'fig' },
					{ label: 'Grape', value: 'grape' },
					{ label: 'Honeydew', value: 'honeydew' },
				]}
				// isMulti
			/>
			<FormProvider {...methods}>
				<VStack gap={4} align="stretch">
					<VStack gap={2} align="stretch">
						{fields.map((field, index) => (
							<PipelineForm
								key={field.id}
								index={index}
								onRemove={() => remove(index)}
								onMoveUp={() => move(index, index - 1)}
								onMoveDown={() => move(index, index + 1)}
								isFirst={index === 0}
								isLast={index === fields.length - 1}
							/>
						))}
					</VStack>
					<Button onClick={handleAddPipeline} colorScheme="blue">
						<LuPlus />
						Add Pipeline
					</Button>
				</VStack>
			</FormProvider>
		</Drawer>
	);
};
