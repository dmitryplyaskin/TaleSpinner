import React from 'react';
import { Box, Stack, Typography, Grid, TextField, IconButton, Button } from '@mui/material';
import { Control, useFieldArray } from 'react-hook-form';
import { Add, Remove } from '@mui/icons-material';
import { FormInput, FormTextarea } from '../../../ui/form-components';

export interface CharacterDetailedFormProps {
	control: Control<any>;
}

export const CharacterDetailedForm: React.FC<CharacterDetailedFormProps> = ({ control }) => {
	const {
		fields: traitFields,
		append: appendTrait,
		remove: removeTrait,
	} = useFieldArray({
		control,
		name: 'personality.traits',
	});

	const {
		fields: motivationFields,
		append: appendMotivation,
		remove: removeMotivation,
	} = useFieldArray({
		control,
		name: 'personality.motivations',
	});

	const {
		fields: fearFields,
		append: appendFear,
		remove: removeFear,
	} = useFieldArray({
		control,
		name: 'personality.fears',
	});

	const {
		fields: strengthFields,
		append: appendStrength,
		remove: removeStrength,
	} = useFieldArray({
		control,
		name: 'personality.strengths',
	});

	const {
		fields: weaknessFields,
		append: appendWeakness,
		remove: removeWeakness,
	} = useFieldArray({
		control,
		name: 'personality.weaknesses',
	});

	const {
		fields: combatSkillFields,
		append: appendCombatSkill,
		remove: removeCombatSkill,
	} = useFieldArray({
		control,
		name: 'skills.combat_skills',
	});

	const {
		fields: socialSkillFields,
		append: appendSocialSkill,
		remove: removeSocialSkill,
	} = useFieldArray({
		control,
		name: 'skills.social_skills',
	});

	const {
		fields: knowledgeSkillFields,
		append: appendKnowledgeSkill,
		remove: removeKnowledgeSkill,
	} = useFieldArray({
		control,
		name: 'skills.knowledge_skills',
	});

	const {
		fields: specialAbilityFields,
		append: appendSpecialAbility,
		remove: removeSpecialAbility,
	} = useFieldArray({
		control,
		name: 'skills.special_abilities',
	});

	const {
		fields: weaponFields,
		append: appendWeapon,
		remove: removeWeapon,
	} = useFieldArray({
		control,
		name: 'equipment.weapons',
	});

	const {
		fields: itemFields,
		append: appendItem,
		remove: removeItem,
	} = useFieldArray({
		control,
		name: 'equipment.items',
	});

	const {
		fields: relationshipFields,
		append: appendRelationship,
		remove: removeRelationship,
	} = useFieldArray({
		control,
		name: 'background.relationships',
	});

	const renderDynamicFieldArray = (
		title: string,
		fields: any[],
		append: (value: any) => void,
		remove: (index: number) => void,
		fieldName: string,
		placeholder: string,
		emptyValue: any = '',
	) => (
		<Box>
			<Typography variant="h6" gutterBottom>
				{title}
			</Typography>
			<Stack spacing={2}>
				{fields.map((field, index) => (
					<Box key={field.id} display="flex" alignItems="center" gap={1}>
						<TextField
							fullWidth
							size="small"
							placeholder={placeholder}
							{...control.register(`${fieldName}.${index}`)}
						/>
						<IconButton size="small" color="error" onClick={() => remove(index)} disabled={fields.length === 1}>
							<Remove />
						</IconButton>
					</Box>
				))}
				<Button startIcon={<Add />} onClick={() => append(emptyValue)} size="small" variant="outlined">
					Добавить
				</Button>
			</Stack>
		</Box>
	);

	return (
		<Box>
			<Stack spacing={4}>
				{/* Характер - черты */}
				{renderDynamicFieldArray(
					'Черты характера',
					traitFields,
					appendTrait,
					removeTrait,
					'personality.traits',
					'Например: храбрость, любопытство, упрямство',
					'',
				)}

				{/* Мотивации */}
				{renderDynamicFieldArray(
					'Мотивации',
					motivationFields,
					appendMotivation,
					removeMotivation,
					'personality.motivations',
					'Цель или желание персонажа',
					'',
				)}

				{/* Страхи */}
				{renderDynamicFieldArray(
					'Страхи и фобии',
					fearFields,
					appendFear,
					removeFear,
					'personality.fears',
					'Чего боится персонаж',
					'',
				)}

				{/* Сильные стороны */}
				{renderDynamicFieldArray(
					'Сильные стороны',
					strengthFields,
					appendStrength,
					removeStrength,
					'personality.strengths',
					'Положительное качество',
					'',
				)}

				{/* Слабые стороны */}
				{renderDynamicFieldArray(
					'Слабые стороны',
					weaknessFields,
					appendWeakness,
					removeWeakness,
					'personality.weaknesses',
					'Недостаток или слабость',
					'',
				)}

				{/* Навыки - боевые */}
				{renderDynamicFieldArray(
					'Боевые навыки',
					combatSkillFields,
					appendCombatSkill,
					removeCombatSkill,
					'skills.combat_skills',
					'Например: фехтование, стрельба из лука',
					'',
				)}

				{/* Навыки - социальные */}
				{renderDynamicFieldArray(
					'Социальные навыки',
					socialSkillFields,
					appendSocialSkill,
					removeSocialSkill,
					'skills.social_skills',
					'Например: убеждение, обман, запугивание',
					'',
				)}

				{/* Навыки - знания */}
				{renderDynamicFieldArray(
					'Знания и навыки',
					knowledgeSkillFields,
					appendKnowledgeSkill,
					removeKnowledgeSkill,
					'skills.knowledge_skills',
					'Например: история, магия, травничество',
					'',
				)}

				{/* Особые способности */}
				{renderDynamicFieldArray(
					'Особые способности',
					specialAbilityFields,
					appendSpecialAbility,
					removeSpecialAbility,
					'skills.special_abilities',
					'Уникальная способность или талант',
					'',
				)}

				{/* Экипировка */}
				<Box>
					<Typography variant="h6" gutterBottom>
						Экипировка
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} md={6}>
							<FormInput
								form={{ name: 'equipment.armor', control }}
								label="Броня"
								fullWidth
								placeholder="Тип и описание брони"
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<FormInput
								form={{ name: 'equipment.clothing', control }}
								label="Одежда"
								fullWidth
								placeholder="Описание одежды"
							/>
						</Grid>
					</Grid>
				</Box>

				{/* Оружие */}
				{renderDynamicFieldArray(
					'Оружие',
					weaponFields,
					appendWeapon,
					removeWeapon,
					'equipment.weapons',
					'Тип и название оружия',
					'',
				)}

				{/* Предметы */}
				{renderDynamicFieldArray(
					'Предметы и инвентарь',
					itemFields,
					appendItem,
					removeItem,
					'equipment.items',
					'Важные предметы персонажа',
					'',
				)}

				{/* Связи */}
				<Box>
					<Typography variant="h6" gutterBottom>
						Важные связи и отношения
					</Typography>
					<Stack spacing={2}>
						{relationshipFields.map((field, index) => (
							<Box key={field.id}>
								<Grid container spacing={2} alignItems="center">
									<Grid item xs={12} md={3}>
										<TextField
											fullWidth
											size="small"
											label="Имя"
											placeholder="Имя персонажа"
											{...control.register(`background.relationships.${index}.name`)}
										/>
									</Grid>
									<Grid item xs={12} md={3}>
										<TextField
											fullWidth
											size="small"
											label="Отношение"
											placeholder="Друг, враг, родственник"
											{...control.register(`background.relationships.${index}.relation`)}
										/>
									</Grid>
									<Grid item xs={12} md={5}>
										<TextField
											fullWidth
											size="small"
											label="Описание"
											placeholder="Как связаны персонажи"
											{...control.register(`background.relationships.${index}.description`)}
										/>
									</Grid>
									<Grid item xs={12} md={1}>
										<IconButton
											size="small"
											color="error"
											onClick={() => removeRelationship(index)}
											disabled={relationshipFields.length === 1}
										>
											<Remove />
										</IconButton>
									</Grid>
								</Grid>
							</Box>
						))}
						<Button
							startIcon={<Add />}
							onClick={() => appendRelationship({ name: '', relation: '', description: '' })}
							size="small"
							variant="outlined"
						>
							Добавить связь
						</Button>
					</Stack>
				</Box>
			</Stack>
		</Box>
	);
};
