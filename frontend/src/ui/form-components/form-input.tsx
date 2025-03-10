import { Box, Input, InputProps } from '@chakra-ui/react';
import { Field, FieldProps } from '../chakra-core-ui/field';
import { useController, UseControllerProps, useFormContext } from 'react-hook-form';
import { InfoTip } from '@ui/chakra-core-ui/toggle-tip';

type FormInputProps = {
	name: string;
	label: string;
	placeholder?: string;
	inputProps?: InputProps;
	fieldProps?: FieldProps;
	containerProps?: UseControllerProps;
	infoTip?: React.ReactNode;
};

export const FormInput: React.FC<FormInputProps> = ({
	name,
	label,
	placeholder,
	inputProps,
	fieldProps,
	containerProps,
	infoTip,
}) => {
	const { control } = useFormContext();
	const {
		field,
		formState: { errors },
	} = useController({
		name,
		control: control,
		...containerProps,
	});

	const errorMessage = <>{errors[name]?.message || ''}</>;

	const labelComponent = (
		<Box display="flex" alignItems="center" gap="2">
			{label}
			{infoTip && <InfoTip content={infoTip} />}
		</Box>
	);

	return (
		<Field {...fieldProps} label={labelComponent} invalid={!!errors[name]} errorText={errorMessage}>
			<Input {...inputProps} {...field} placeholder={placeholder} />
		</Field>
	);
};
