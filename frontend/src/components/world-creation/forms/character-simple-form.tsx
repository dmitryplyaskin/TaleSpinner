import React from 'react';
import { Box } from '@mui/material';
import { Control } from 'react-hook-form';
import { FormInput, FormTextarea } from '../../../ui/form-components';
import { Character } from '@shared/types/character';

export interface CharacterSimpleFormProps {
	control: Control<Character>;
}

export const CharacterSimpleForm: React.FC<CharacterSimpleFormProps> = ({ control }) => {
	return (
		<Box display="flex" flexDirection="column" gap={2}>
			<FormInput
				form={{ name: 'name', control }}
				label="Имя персонажа"
				required
				fullWidth
				placeholder="Введите имя персонажа"
			/>

			<FormTextarea
				form={{ name: 'description', control }}
				label="Общее описание персонажа"
				rows={4}
				fullWidth
				placeholder="Краткое описание персонажа, его роль в истории, основные черты..."
			/>

			<FormTextarea
				form={{ name: 'appearance', control }}
				label="Внешность"
				rows={5}
				fullWidth
				placeholder="Опишите внешний вид персонажа: рост, телосложение, цвет волос и глаз, отличительные черты..."
			/>

			<FormTextarea
				form={{ name: 'personality', control }}
				label="Характер"
				rows={5}
				fullWidth
				placeholder="Опишите характер персонажа: темперамент, привычки, мотивации, страхи, сильные и слабые стороны..."
			/>

			<FormTextarea
				form={{ name: 'clothing', control }}
				label="Одежда"
				rows={4}
				fullWidth
				placeholder="Опишите стиль одежды персонажа, любимые наряды, особенности гардероба..."
			/>

			<FormTextarea
				form={{ name: 'equipment', control }}
				label="Снаряжение"
				rows={4}
				fullWidth
				placeholder="Опишите оружие, инструменты, магические предметы и другое снаряжение персонажа..."
			/>
		</Box>
	);
};
