import React, { useState } from 'react';
import { useUnit } from 'effector-react';
import {
	Box,
	Typography,
	Tabs,
	Tab,
	TextField,
	Button,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Alert,
	Paper,
	Chip,
	CircularProgress,
	Grid,
} from '@mui/material';
import {
	ExpandMore as ExpandMoreIcon,
	Save,
	Public,
	Groups,
	LocationOn,
	People,
	History,
	AutoAwesome,
	Edit as EditIcon,
	Check as CheckIcon,
} from '@mui/icons-material';
import { $worldData, $sessionId, $isSaving, $error, updateWorldData, saveWorldFx, clearError } from '../../model';

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
	<Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
		{value === index && children}
	</Box>
);

const FieldDisplay = ({
	label,
	value,
	isEditing,
	onChange,
	multiline = false,
	rows = 1,
}: {
	label: string;
	value?: string;
	isEditing: boolean;
	onChange: (val: string) => void;
	multiline?: boolean;
	rows?: number;
}) => {
	if (isEditing) {
		return (
			<TextField
				label={label}
				value={value || ''}
				fullWidth
				multiline={multiline}
				rows={rows}
				onChange={(e) => onChange(e.target.value)}
				variant="outlined"
				size="small"
				sx={{ mb: 2 }}
			/>
		);
	}

	return (
		<Box sx={{ mb: 3 }}>
			<Typography variant="subtitle2" color="text.secondary" gutterBottom>
				{label}
			</Typography>
			<Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
				{value || '—'}
			</Typography>
		</Box>
	);
};

export const WorldReview: React.FC = () => {
	const [tab, setTab] = useState(0);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	const world = useUnit($worldData);
	const sessionId = useUnit($sessionId);
	const isSaving = useUnit($isSaving);
	const error = useUnit($error);

	const handleUpdateWorldData = useUnit(updateWorldData);
	const handleSaveWorld = useUnit(saveWorldFx);
	const handleClearError = useUnit(clearError);

	const handleSave = async () => {
		if (sessionId && world) {
			handleSaveWorld({ sessionId, worldData: world });
			setSaveSuccess(true);
		}
	};

	if (!world) {
		return (
			<Box sx={{ textAlign: 'center', py: 8 }}>
				<Typography color="text.secondary">Данные мира не сгенерированы.</Typography>
			</Box>
		);
	}

	const tabConfig = [
		{ label: 'Обзор', icon: <Public sx={{ fontSize: 20 }} /> },
		{ label: 'Фракции', icon: <Groups sx={{ fontSize: 20 }} />, count: world.factions?.length },
		{ label: 'Локации', icon: <LocationOn sx={{ fontSize: 20 }} />, count: world.locations?.length },
		{ label: 'Расы', icon: <People sx={{ fontSize: 20 }} />, count: world.races?.length },
		{ label: 'История', icon: <History sx={{ fontSize: 20 }} />, count: world.history?.length },
		{ label: 'Магия', icon: <AutoAwesome sx={{ fontSize: 20 }} /> },
	];

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
				<Box>
					<Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
						Проверьте ваш мир
					</Typography>
					<Typography variant="body1" color="text.secondary">
						Просмотрите и отредактируйте сгенерированные данные перед сохранением
					</Typography>
				</Box>
				<Button
					variant={isEditing ? 'contained' : 'outlined'}
					startIcon={isEditing ? <CheckIcon /> : <EditIcon />}
					onClick={() => setIsEditing(!isEditing)}
					color={isEditing ? 'success' : 'primary'}
				>
					{isEditing ? 'Завершить' : 'Редактировать'}
				</Button>
			</Box>

			{error && (
				<Alert severity="error" onClose={handleClearError}>
					{error}
				</Alert>
			)}

			{saveSuccess && <Alert severity="success">Мир успешно сохранён! Перенаправление...</Alert>}

			<Paper sx={{ borderRadius: 2 }}>
				<Tabs
					value={tab}
					onChange={(_, v) => setTab(v)}
					variant="scrollable"
					scrollButtons="auto"
					sx={{
						borderBottom: 1,
						borderColor: 'divider',
						'& .MuiTab-root': {
							minHeight: 56,
						},
					}}
				>
					{tabConfig.map((t, idx) => (
						<Tab
							key={idx}
							label={
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									{t.icon}
									<span>{t.label}</span>
									{t.count !== undefined && t.count > 0 && (
										<Chip label={t.count} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
									)}
								</Box>
							}
						/>
					))}
				</Tabs>

				<Box sx={{ p: 4, minHeight: 400 }}>
					{/* Overview Tab */}
					<TabPanel value={tab} index={0}>
						<Grid container spacing={4}>
							<Grid size={{ xs: 12 }}>
								<FieldDisplay
									label="Название мира"
									value={world.name}
									isEditing={isEditing}
									onChange={(val) => handleUpdateWorldData({ name: val })}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<FieldDisplay
									label="Жанр"
									value={world.genre}
									isEditing={isEditing}
									onChange={(val) => handleUpdateWorldData({ genre: val })}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<FieldDisplay
									label="Атмосфера"
									value={world.tone}
									isEditing={isEditing}
									onChange={(val) => handleUpdateWorldData({ tone: val })}
								/>
							</Grid>
							<Grid size={{ xs: 12 }}>
								<FieldDisplay
									label="Описание мира"
									value={world.world_primer}
									isEditing={isEditing}
									multiline
									rows={8}
									onChange={(val) => handleUpdateWorldData({ world_primer: val })}
								/>
							</Grid>
						</Grid>
					</TabPanel>

					{/* Factions Tab */}
					<TabPanel value={tab} index={1}>
						{world.factions && world.factions.length > 0 ? (
							world.factions.map((faction, idx) => (
								<Accordion
									key={idx}
									defaultExpanded={idx === 0}
									elevation={0}
									sx={{ border: '1px solid', borderColor: 'divider', mb: 2, borderRadius: 1 }}
								>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
											<Groups color="primary" />
											<Typography fontWeight={500} sx={{ flex: 1 }}>
												{faction.name}
											</Typography>
											{faction.type && <Chip label={faction.type} size="small" variant="outlined" />}
										</Box>
									</AccordionSummary>
									<AccordionDetails>
										<Grid container spacing={2}>
											<Grid size={{ xs: 12, sm: 6 }}>
												<FieldDisplay
													label="Название"
													value={faction.name}
													isEditing={isEditing}
													onChange={(val) => {
														const updated = [...(world.factions || [])];
														updated[idx] = { ...updated[idx], name: val };
														handleUpdateWorldData({ factions: updated });
													}}
												/>
											</Grid>
											<Grid size={{ xs: 12, sm: 6 }}>
												<FieldDisplay
													label="Тип организации"
													value={faction.type}
													isEditing={isEditing}
													onChange={(val) => {
														const updated = [...(world.factions || [])];
														updated[idx] = { ...updated[idx], type: val };
														handleUpdateWorldData({ factions: updated });
													}}
												/>
											</Grid>
											<Grid size={{ xs: 12 }}>
												<FieldDisplay
													label="Идеология и цели"
													value={faction.ideology_and_goals}
													isEditing={isEditing}
													multiline
													rows={3}
													onChange={(val) => {
														const updated = [...(world.factions || [])];
														updated[idx] = { ...updated[idx], ideology_and_goals: val };
														handleUpdateWorldData({ factions: updated });
													}}
												/>
											</Grid>
											<Grid size={{ xs: 12 }}>
												<FieldDisplay
													label="Структура"
													value={faction.structure}
													isEditing={isEditing}
													multiline
													rows={3}
													onChange={(val) => {
														const updated = [...(world.factions || [])];
														updated[idx] = { ...updated[idx], structure: val };
														handleUpdateWorldData({ factions: updated });
													}}
												/>
											</Grid>
										</Grid>
									</AccordionDetails>
								</Accordion>
							))
						) : (
							<Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
								Фракции не сгенерированы
							</Typography>
						)}
					</TabPanel>

					{/* Locations Tab */}
					<TabPanel value={tab} index={2}>
						{world.locations && world.locations.length > 0 ? (
							world.locations.map((location, idx) => (
								<Accordion
									key={idx}
									defaultExpanded={idx === 0}
									elevation={0}
									sx={{ border: '1px solid', borderColor: 'divider', mb: 2, borderRadius: 1 }}
								>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
											<LocationOn color="primary" />
											<Typography fontWeight={500} sx={{ flex: 1 }}>
												{location.name}
											</Typography>
											{location.type && <Chip label={location.type} size="small" variant="outlined" />}
										</Box>
									</AccordionSummary>
									<AccordionDetails>
										<Grid container spacing={2}>
											<Grid size={{ xs: 12, sm: 6 }}>
												<FieldDisplay
													label="Название"
													value={location.name}
													isEditing={isEditing}
													onChange={(val) => {
														const updated = [...(world.locations || [])];
														updated[idx] = { ...updated[idx], name: val };
														handleUpdateWorldData({ locations: updated });
													}}
												/>
											</Grid>
											<Grid size={{ xs: 12, sm: 6 }}>
												<FieldDisplay
													label="Тип локации"
													value={location.type}
													isEditing={isEditing}
													onChange={(val) => {
														const updated = [...(world.locations || [])];
														updated[idx] = { ...updated[idx], type: val };
														handleUpdateWorldData({ locations: updated });
													}}
												/>
											</Grid>
											<Grid size={{ xs: 12 }}>
												<FieldDisplay
													label="Описание"
													value={location.appearance}
													isEditing={isEditing}
													multiline
													rows={3}
													onChange={(val) => {
														const updated = [...(world.locations || [])];
														updated[idx] = { ...updated[idx], appearance: val };
														handleUpdateWorldData({ locations: updated });
													}}
												/>
											</Grid>
										</Grid>
									</AccordionDetails>
								</Accordion>
							))
						) : (
							<Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
								Локации не сгенерированы
							</Typography>
						)}
					</TabPanel>

					{/* Races Tab */}
					<TabPanel value={tab} index={3}>
						{world.races && world.races.length > 0 ? (
							world.races.map((race, idx) => (
								<Accordion
									key={idx}
									defaultExpanded={idx === 0}
									elevation={0}
									sx={{ border: '1px solid', borderColor: 'divider', mb: 2, borderRadius: 1 }}
								>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
											<People color="primary" />
											<Typography fontWeight={500} sx={{ flex: 1 }}>
												{race.name}
											</Typography>
										</Box>
									</AccordionSummary>
									<AccordionDetails>
										<Grid container spacing={2}>
											<Grid size={{ xs: 12 }}>
												<FieldDisplay
													label="Название"
													value={race.name}
													isEditing={isEditing}
													onChange={(val) => {
														const updated = [...(world.races || [])];
														updated[idx] = { ...updated[idx], name: val };
														handleUpdateWorldData({ races: updated });
													}}
												/>
											</Grid>
											<Grid size={{ xs: 12 }}>
												<FieldDisplay
													label="Описание"
													value={race.description}
													isEditing={isEditing}
													multiline
													rows={3}
													onChange={(val) => {
														const updated = [...(world.races || [])];
														updated[idx] = { ...updated[idx], description: val };
														handleUpdateWorldData({ races: updated });
													}}
												/>
											</Grid>
											<Grid size={{ xs: 12 }}>
												<FieldDisplay
													label="Особые способности"
													value={race.special_abilities}
													isEditing={isEditing}
													multiline
													rows={3}
													onChange={(val) => {
														const updated = [...(world.races || [])];
														updated[idx] = { ...updated[idx], special_abilities: val };
														handleUpdateWorldData({ races: updated });
													}}
												/>
											</Grid>
										</Grid>
									</AccordionDetails>
								</Accordion>
							))
						) : (
							<Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
								Расы не сгенерированы
							</Typography>
						)}
					</TabPanel>

					{/* History Tab */}
					<TabPanel value={tab} index={4}>
						{world.history && world.history.length > 0 ? (
							world.history.map((event, idx) => (
								<Accordion
									key={idx}
									defaultExpanded={idx === 0}
									elevation={0}
									sx={{ border: '1px solid', borderColor: 'divider', mb: 2, borderRadius: 1 }}
								>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
											<History color="primary" />
											<Typography fontWeight={500} sx={{ flex: 1 }}>
												{event.name}
											</Typography>
											{event.timeframe && <Chip label={event.timeframe} size="small" variant="outlined" />}
										</Box>
									</AccordionSummary>
									<AccordionDetails>
										<Grid container spacing={2}>
											<Grid size={{ xs: 12, sm: 6 }}>
												<FieldDisplay
													label="Название события"
													value={event.name}
													isEditing={isEditing}
													onChange={(val) => {
														const updated = [...(world.history || [])];
														updated[idx] = { ...updated[idx], name: val };
														handleUpdateWorldData({ history: updated });
													}}
												/>
											</Grid>
											<Grid size={{ xs: 12, sm: 6 }}>
												<FieldDisplay
													label="Временной период"
													value={event.timeframe}
													isEditing={isEditing}
													onChange={(val) => {
														const updated = [...(world.history || [])];
														updated[idx] = { ...updated[idx], timeframe: val };
														handleUpdateWorldData({ history: updated });
													}}
												/>
											</Grid>
											<Grid size={{ xs: 12 }}>
												<FieldDisplay
													label="Описание"
													value={event.description}
													isEditing={isEditing}
													multiline
													rows={3}
													onChange={(val) => {
														const updated = [...(world.history || [])];
														updated[idx] = { ...updated[idx], description: val };
														handleUpdateWorldData({ history: updated });
													}}
												/>
											</Grid>
										</Grid>
									</AccordionDetails>
								</Accordion>
							))
						) : (
							<Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
								История не сгенерирована
							</Typography>
						)}
					</TabPanel>

					{/* Magic Tab */}
					<TabPanel value={tab} index={5}>
						{world.magic ? (
							<Grid container spacing={3}>
								<Grid size={{ xs: 12 }}>
									<FieldDisplay
										label="Основы магии"
										value={world.magic.magic_fundamentals}
										isEditing={isEditing}
										multiline
										rows={4}
										onChange={(val) =>
											handleUpdateWorldData({
												magic: { ...world.magic!, magic_fundamentals: val },
											})
										}
									/>
								</Grid>
								<Grid size={{ xs: 12 }}>
									<FieldDisplay
										label="Источники силы"
										value={world.magic.power_sources}
										isEditing={isEditing}
										multiline
										rows={3}
										onChange={(val) =>
											handleUpdateWorldData({
												magic: { ...world.magic!, power_sources: val },
											})
										}
									/>
								</Grid>
								<Grid size={{ xs: 12 }}>
									<FieldDisplay
										label="Ограничения и цена"
										value={world.magic.limitations_and_costs}
										isEditing={isEditing}
										multiline
										rows={3}
										onChange={(val) =>
											handleUpdateWorldData({
												magic: { ...world.magic!, limitations_and_costs: val },
											})
										}
									/>
								</Grid>
								<Grid size={{ xs: 12 }}>
									<FieldDisplay
										label="Отношение общества"
										value={world.magic.societal_attitude}
										isEditing={isEditing}
										multiline
										rows={2}
										onChange={(val) =>
											handleUpdateWorldData({
												magic: { ...world.magic!, societal_attitude: val },
											})
										}
									/>
								</Grid>

								{world.magic.magic_schools && world.magic.magic_schools.length > 0 && (
									<Grid size={{ xs: 12 }}>
										<Typography variant="h6" sx={{ mb: 2 }}>
											Школы магии
										</Typography>
										{world.magic.magic_schools.map((school, idx) => (
											<Paper key={idx} sx={{ p: 2, mb: 2 }} variant="outlined">
												<Grid container spacing={2}>
													<Grid size={{ xs: 12 }}>
														<FieldDisplay
															label="Название школы"
															value={school.name}
															isEditing={isEditing}
															onChange={(val) => {
																const updated = [...world.magic!.magic_schools];
																updated[idx] = { ...updated[idx], name: val };
																handleUpdateWorldData({
																	magic: { ...world.magic!, magic_schools: updated },
																});
															}}
														/>
													</Grid>
													<Grid size={{ xs: 12 }}>
														<FieldDisplay
															label="Описание"
															value={school.description}
															isEditing={isEditing}
															multiline
															rows={2}
															onChange={(val) => {
																const updated = [...world.magic!.magic_schools];
																updated[idx] = { ...updated[idx], description: val };
																handleUpdateWorldData({
																	magic: { ...world.magic!, magic_schools: updated },
																});
															}}
														/>
													</Grid>
												</Grid>
											</Paper>
										))}
									</Grid>
								)}
							</Grid>
						) : (
							<Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
								Система магии не сгенерирована
							</Typography>
						)}
					</TabPanel>
				</Box>
			</Paper>

			{/* Save Button */}
			<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
				<Button
					variant="contained"
					color="primary"
					size="large"
					onClick={handleSave}
					disabled={isSaving || saveSuccess}
					startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <Save />}
					sx={{
						minWidth: 200,
						py: 1.5,
					}}
				>
					{isSaving ? 'Сохранение...' : saveSuccess ? 'Сохранено!' : 'Сохранить мир'}
				</Button>
			</Box>
		</Box>
	);
};
