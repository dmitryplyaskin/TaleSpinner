import { Group, Input, NumberInput, type InputWrapperProps, type NumberInputProps } from '@mantine/core';
import { useController, type UseControllerProps, useFormContext } from 'react-hook-form';

import { InfoTip } from '@ui/info-tip';

type FormNumberInputProps = {
	name: string;
	label: string;
	numberInputProps?: Omit<NumberInputProps, 'value' | 'defaultValue' | 'onChange' | 'label' | 'error'>;
	fieldProps?: Omit<InputWrapperProps, 'children'>;
	containerProps?: UseControllerProps;
	infoTip?: React.ReactNode;
};

export const FormNumberInput: React.FC<FormNumberInputProps> = ({
	name,
	label,
	numberInputProps,
	fieldProps,
	containerProps,
	infoTip,
}) => {
	const normalizeNumber = (input: unknown): number => {
		if (typeof input === 'number' && Number.isFinite(input)) return input;
		if (typeof input === 'string') {
			const normalized = input.trim().replace(',', '.');
			if (normalized.length === 0) return 0;
			const parsed = Number(normalized);
			if (Number.isFinite(parsed)) return parsed;
		}
		return 0;
	};

	const { control } = useFormContext();
	const {
		field: { value, onChange, ...field },
		fieldState,
	} = useController({
		name,
		control: control,
		...containerProps,
	});

	const errorMessage = typeof fieldState.error?.message === 'string' ? fieldState.error.message : '';
	const labelComponent = (
		<Group gap={6} wrap="nowrap">
			{label}
			{infoTip && <InfoTip content={infoTip} />}
		</Group>
	);

	return (
		<Input.Wrapper {...fieldProps} label={labelComponent} error={errorMessage || undefined}>
			<NumberInput
				{...numberInputProps}
				{...field}
				value={normalizeNumber(value)}
				onChange={(v) => onChange(normalizeNumber(v))}
			/>
		</Input.Wrapper>
	);
};

