import React from 'react';
import {
	Box,
	Stack,
	Typography,
	Card,
	CardContent,
	IconButton,
	Button,
	Divider,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from '@mui/material';
import { Control, useFieldArray } from 'react-hook-form';
import { FormInput, FormTextarea } from '../../../ui/form-components';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export interface WorldPrimerDetailedElementsFormProps {
	control: Control<any>;
}

// Компонент для детализированных рас
const DetailedRacesSection: React.FC<{ control: Control<any> }> = ({ control }) => {
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'detailed_elements.races.races',
	});

	const addRace = () => {
		append({
			name: '',
			description: '',
			relationship_to_conflict: '',
			special_abilities: '',
			social_structure: '',
		});
	};

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
					Детализированные расы
				</Typography>
				<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addRace}>
					Добавить расу
				</Button>
			</Box>

			<Stack spacing={2}>
				{fields.map((field, index) => (
					<Accordion key={field.id}>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
								<Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
									Раса #{index + 1}
								</Typography>
								<IconButton
									size="small"
									color="error"
									onClick={(e) => {
										e.stopPropagation();
										remove(index);
									}}
									sx={{ ml: 1 }}
								>
									<DeleteIcon />
								</IconButton>
							</Box>
						</AccordionSummary>
						<AccordionDetails>
							<Stack spacing={3}>
								<FormInput
									form={{ name: `detailed_elements.races.races.${index}.name`, control }}
									label="Название расы"
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.races.races.${index}.description`, control }}
									label="Описание"
									rows={3}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.races.races.${index}.relationship_to_conflict`, control }}
									label="Отношение к конфликту"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.races.races.${index}.special_abilities`, control }}
									label="Особые способности"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.races.races.${index}.social_structure`, control }}
									label="Социальная структура"
									rows={2}
									fullWidth
								/>
							</Stack>
						</AccordionDetails>
					</Accordion>
				))}
			</Stack>

			{fields.length === 0 && (
				<Box
					textAlign="center"
					py={4}
					sx={{
						border: '2px dashed',
						borderColor: 'divider',
						borderRadius: 2,
					}}
				>
					<Typography variant="body2" color="text.secondary" mb={2}>
						Нет детализированных рас
					</Typography>
					<Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addRace}>
						Добавить первую расу
					</Button>
				</Box>
			)}
		</Box>
	);
};

// Компонент для временной линии
const TimelineSection: React.FC<{ control: Control<any> }> = ({ control }) => {
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'detailed_elements.timeline.historical_events',
	});

	const addEvent = () => {
		append({
			name: '',
			timeframe: '',
			description: '',
			impact_on_present: '',
		});
	};

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
					Историческая временная линия
				</Typography>
				<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addEvent}>
					Добавить событие
				</Button>
			</Box>

			<Stack spacing={2}>
				{fields.map((field, index) => (
					<Accordion key={field.id}>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
								<Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
									Событие #{index + 1}
								</Typography>
								<IconButton
									size="small"
									color="error"
									onClick={(e) => {
										e.stopPropagation();
										remove(index);
									}}
									sx={{ ml: 1 }}
								>
									<DeleteIcon />
								</IconButton>
							</Box>
						</AccordionSummary>
						<AccordionDetails>
							<Stack spacing={3}>
								<Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
									<FormInput
										form={{ name: `detailed_elements.timeline.historical_events.${index}.name`, control }}
										label="Название события"
										fullWidth
									/>
									<FormInput
										form={{ name: `detailed_elements.timeline.historical_events.${index}.timeframe`, control }}
										label="Временной период"
										fullWidth
										placeholder="напр. 1000 лет назад, Эра Драконов"
									/>
								</Box>
								<FormTextarea
									form={{ name: `detailed_elements.timeline.historical_events.${index}.description`, control }}
									label="Описание события"
									rows={3}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.timeline.historical_events.${index}.impact_on_present`, control }}
									label="Влияние на настоящее"
									rows={2}
									fullWidth
								/>
							</Stack>
						</AccordionDetails>
					</Accordion>
				))}
			</Stack>

			{fields.length === 0 && (
				<Box
					textAlign="center"
					py={4}
					sx={{
						border: '2px dashed',
						borderColor: 'divider',
						borderRadius: 2,
					}}
				>
					<Typography variant="body2" color="text.secondary" mb={2}>
						Нет исторических событий
					</Typography>
					<Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addEvent}>
						Добавить первое событие
					</Button>
				</Box>
			)}
		</Box>
	);
};

// Компонент для детализированных локаций
const DetailedLocationsSection: React.FC<{ control: Control<any> }> = ({ control }) => {
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'detailed_elements.locations.locations',
	});

	const addLocation = () => {
		append({
			name: '',
			type: '',
			appearance: '',
			history: '',
			inhabitants: '',
			significance: '',
			features_and_secrets: '',
			adventure_opportunities: '',
		});
	};

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
					Детализированные локации
				</Typography>
				<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLocation}>
					Добавить локацию
				</Button>
			</Box>

			<Stack spacing={2}>
				{fields.map((field, index) => (
					<Accordion key={field.id}>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
								<Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
									Локация #{index + 1}
								</Typography>
								<IconButton
									size="small"
									color="error"
									onClick={(e) => {
										e.stopPropagation();
										remove(index);
									}}
									sx={{ ml: 1 }}
								>
									<DeleteIcon />
								</IconButton>
							</Box>
						</AccordionSummary>
						<AccordionDetails>
							<Stack spacing={3}>
								<Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
									<FormInput
										form={{ name: `detailed_elements.locations.locations.${index}.name`, control }}
										label="Название локации"
										fullWidth
									/>
									<FormInput
										form={{ name: `detailed_elements.locations.locations.${index}.type`, control }}
										label="Тип локации"
										fullWidth
										placeholder="напр. город, лес, подземелье"
									/>
								</Box>
								<FormTextarea
									form={{ name: `detailed_elements.locations.locations.${index}.appearance`, control }}
									label="Внешний вид"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.locations.locations.${index}.history`, control }}
									label="История"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.locations.locations.${index}.inhabitants`, control }}
									label="Жители"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.locations.locations.${index}.significance`, control }}
									label="Значение"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.locations.locations.${index}.features_and_secrets`, control }}
									label="Особенности и секреты"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.locations.locations.${index}.adventure_opportunities`, control }}
									label="Возможности для приключений"
									rows={2}
									fullWidth
								/>
							</Stack>
						</AccordionDetails>
					</Accordion>
				))}
			</Stack>

			{fields.length === 0 && (
				<Box
					textAlign="center"
					py={4}
					sx={{
						border: '2px dashed',
						borderColor: 'divider',
						borderRadius: 2,
					}}
				>
					<Typography variant="body2" color="text.secondary" mb={2}>
						Нет детализированных локаций
					</Typography>
					<Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addLocation}>
						Добавить первую локацию
					</Button>
				</Box>
			)}
		</Box>
	);
};

// Компонент для детализированных фракций
const DetailedFactionsSection: React.FC<{ control: Control<any> }> = ({ control }) => {
	const { fields, append, remove } = useFieldArray({
		control,
		name: 'detailed_elements.factions.factions',
	});

	const addFaction = () => {
		append({
			name: '',
			type: '',
			ideology_and_goals: '',
			structure: '',
			key_leaders: '',
			methods: '',
			relationships: '',
			role_in_conflict: '',
			resources_and_influence: '',
		});
	};

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
					Детализированные фракции
				</Typography>
				<Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addFaction}>
					Добавить фракцию
				</Button>
			</Box>

			<Stack spacing={2}>
				{fields.map((field, index) => (
					<Accordion key={field.id}>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
								<Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
									Фракция #{index + 1}
								</Typography>
								<IconButton
									size="small"
									color="error"
									onClick={(e) => {
										e.stopPropagation();
										remove(index);
									}}
									sx={{ ml: 1 }}
								>
									<DeleteIcon />
								</IconButton>
							</Box>
						</AccordionSummary>
						<AccordionDetails>
							<Stack spacing={3}>
								<Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
									<FormInput
										form={{ name: `detailed_elements.factions.factions.${index}.name`, control }}
										label="Название фракции"
										fullWidth
									/>
									<FormInput
										form={{ name: `detailed_elements.factions.factions.${index}.type`, control }}
										label="Тип фракции"
										fullWidth
										placeholder="напр. гильдия, религиозный орден"
									/>
								</Box>
								<FormTextarea
									form={{ name: `detailed_elements.factions.factions.${index}.ideology_and_goals`, control }}
									label="Идеология и цели"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.factions.factions.${index}.structure`, control }}
									label="Структура"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.factions.factions.${index}.key_leaders`, control }}
									label="Ключевые лидеры"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.factions.factions.${index}.methods`, control }}
									label="Методы"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.factions.factions.${index}.relationships`, control }}
									label="Взаимоотношения"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.factions.factions.${index}.role_in_conflict`, control }}
									label="Роль в конфликте"
									rows={2}
									fullWidth
								/>
								<FormTextarea
									form={{ name: `detailed_elements.factions.factions.${index}.resources_and_influence`, control }}
									label="Ресурсы и влияние"
									rows={2}
									fullWidth
								/>
							</Stack>
						</AccordionDetails>
					</Accordion>
				))}
			</Stack>

			{fields.length === 0 && (
				<Box
					textAlign="center"
					py={4}
					sx={{
						border: '2px dashed',
						borderColor: 'divider',
						borderRadius: 2,
					}}
				>
					<Typography variant="body2" color="text.secondary" mb={2}>
						Нет детализированных фракций
					</Typography>
					<Button variant="contained" size="small" startIcon={<AddIcon />} onClick={addFaction}>
						Добавить первую фракцию
					</Button>
				</Box>
			)}
		</Box>
	);
};

export const WorldPrimerDetailedElementsForm: React.FC<WorldPrimerDetailedElementsFormProps> = ({ control }) => {
	return (
		<Box>
			<Stack spacing={4}>
				<DetailedRacesSection control={control} />
				<Divider />
				<TimelineSection control={control} />
				<Divider />
				<DetailedLocationsSection control={control} />
				<Divider />
				<DetailedFactionsSection control={control} />
			</Stack>
		</Box>
	);
};
