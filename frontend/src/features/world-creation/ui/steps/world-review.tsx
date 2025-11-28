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
} from '@mui/icons-material';
import {
	$worldData,
	$sessionId,
	$isSaving,
	$error,
	updateWorldData,
	saveWorldFx,
	clearError,
} from '../../model';

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

export const WorldReview: React.FC = () => {
	const [tab, setTab] = useState(0);
	const [saveSuccess, setSaveSuccess] = useState(false);

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
			<Box sx={{ textAlign: 'center', mb: 2 }}>
				<Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
					Проверьте ваш мир
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Просмотрите и отредактируйте сгенерированные данные перед сохранением
				</Typography>
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

				<Box sx={{ p: 3, minHeight: 400 }}>
					{/* Overview Tab */}
					<TabPanel value={tab} index={0}>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
							<TextField
								label="Название мира"
								value={world.name}
								fullWidth
								onChange={(e) => handleUpdateWorldData({ name: e.target.value })}
							/>
							<Box sx={{ display: 'flex', gap: 2 }}>
								<TextField
									label="Жанр"
									value={world.genre}
									fullWidth
									onChange={(e) => handleUpdateWorldData({ genre: e.target.value })}
								/>
								<TextField
									label="Атмосфера"
									value={world.tone}
									fullWidth
									onChange={(e) => handleUpdateWorldData({ tone: e.target.value })}
								/>
							</Box>
							<TextField
								label="Описание мира"
								value={world.world_primer}
								multiline
								rows={8}
								fullWidth
								onChange={(e) => handleUpdateWorldData({ world_primer: e.target.value })}
							/>
						</Box>
					</TabPanel>

					{/* Factions Tab */}
					<TabPanel value={tab} index={1}>
						{world.factions && world.factions.length > 0 ? (
							world.factions.map((faction, idx) => (
								<Accordion key={idx} defaultExpanded={idx === 0}>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
											<Groups color="primary" />
											<Typography fontWeight={500}>{faction.name}</Typography>
											{faction.type && <Chip label={faction.type} size="small" variant="outlined" />}
										</Box>
									</AccordionSummary>
									<AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
										<TextField
											label="Название"
											value={faction.name}
											fullWidth
											onChange={(e) => {
												const updated = [...(world.factions || [])];
												updated[idx] = { ...updated[idx], name: e.target.value };
												handleUpdateWorldData({ factions: updated });
											}}
										/>
										<TextField
											label="Тип организации"
											value={faction.type}
											fullWidth
											onChange={(e) => {
												const updated = [...(world.factions || [])];
												updated[idx] = { ...updated[idx], type: e.target.value };
												handleUpdateWorldData({ factions: updated });
											}}
										/>
										<TextField
											label="Идеология и цели"
											value={faction.ideology_and_goals}
											fullWidth
											multiline
											rows={3}
											onChange={(e) => {
												const updated = [...(world.factions || [])];
												updated[idx] = { ...updated[idx], ideology_and_goals: e.target.value };
												handleUpdateWorldData({ factions: updated });
											}}
										/>
										<TextField
											label="Структура"
											value={faction.structure}
											fullWidth
											multiline
											onChange={(e) => {
												const updated = [...(world.factions || [])];
												updated[idx] = { ...updated[idx], structure: e.target.value };
												handleUpdateWorldData({ factions: updated });
											}}
										/>
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
								<Accordion key={idx} defaultExpanded={idx === 0}>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
											<LocationOn color="primary" />
											<Typography fontWeight={500}>{location.name}</Typography>
											{location.type && <Chip label={location.type} size="small" variant="outlined" />}
										</Box>
									</AccordionSummary>
									<AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
										<TextField
											label="Название"
											value={location.name}
											fullWidth
											onChange={(e) => {
												const updated = [...(world.locations || [])];
												updated[idx] = { ...updated[idx], name: e.target.value };
												handleUpdateWorldData({ locations: updated });
											}}
										/>
										<TextField
											label="Тип локации"
											value={location.type}
											fullWidth
											onChange={(e) => {
												const updated = [...(world.locations || [])];
												updated[idx] = { ...updated[idx], type: e.target.value };
												handleUpdateWorldData({ locations: updated });
											}}
										/>
										<TextField
											label="Описание"
											value={location.appearance}
											fullWidth
											multiline
											rows={3}
											onChange={(e) => {
												const updated = [...(world.locations || [])];
												updated[idx] = { ...updated[idx], appearance: e.target.value };
												handleUpdateWorldData({ locations: updated });
											}}
										/>
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
								<Accordion key={idx} defaultExpanded={idx === 0}>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
											<People color="primary" />
											<Typography fontWeight={500}>{race.name}</Typography>
										</Box>
									</AccordionSummary>
									<AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
										<TextField
											label="Название"
											value={race.name}
											fullWidth
											onChange={(e) => {
												const updated = [...(world.races || [])];
												updated[idx] = { ...updated[idx], name: e.target.value };
												handleUpdateWorldData({ races: updated });
											}}
										/>
										<TextField
											label="Описание"
											value={race.description}
											fullWidth
											multiline
											rows={3}
											onChange={(e) => {
												const updated = [...(world.races || [])];
												updated[idx] = { ...updated[idx], description: e.target.value };
												handleUpdateWorldData({ races: updated });
											}}
										/>
										<TextField
											label="Особые способности"
											value={race.special_abilities}
											fullWidth
											multiline
											onChange={(e) => {
												const updated = [...(world.races || [])];
												updated[idx] = { ...updated[idx], special_abilities: e.target.value };
												handleUpdateWorldData({ races: updated });
											}}
										/>
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
								<Accordion key={idx} defaultExpanded={idx === 0}>
									<AccordionSummary expandIcon={<ExpandMoreIcon />}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
											<History color="primary" />
											<Typography fontWeight={500}>{event.name}</Typography>
											{event.timeframe && <Chip label={event.timeframe} size="small" variant="outlined" />}
										</Box>
									</AccordionSummary>
									<AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
										<TextField
											label="Название события"
											value={event.name}
											fullWidth
											onChange={(e) => {
												const updated = [...(world.history || [])];
												updated[idx] = { ...updated[idx], name: e.target.value };
												handleUpdateWorldData({ history: updated });
											}}
										/>
										<TextField
											label="Временной период"
											value={event.timeframe}
											fullWidth
											onChange={(e) => {
												const updated = [...(world.history || [])];
												updated[idx] = { ...updated[idx], timeframe: e.target.value };
												handleUpdateWorldData({ history: updated });
											}}
										/>
										<TextField
											label="Описание"
											value={event.description}
											fullWidth
											multiline
											rows={3}
											onChange={(e) => {
												const updated = [...(world.history || [])];
												updated[idx] = { ...updated[idx], description: e.target.value };
												handleUpdateWorldData({ history: updated });
											}}
										/>
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
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
								<TextField
									label="Основы магии"
									value={world.magic.magic_fundamentals}
									fullWidth
									multiline
									rows={4}
									onChange={(e) =>
										handleUpdateWorldData({
											magic: { ...world.magic!, magic_fundamentals: e.target.value },
										})
									}
								/>
								<TextField
									label="Источники силы"
									value={world.magic.power_sources}
									fullWidth
									multiline
									rows={3}
									onChange={(e) =>
										handleUpdateWorldData({
											magic: { ...world.magic!, power_sources: e.target.value },
										})
									}
								/>
								<TextField
									label="Ограничения и цена"
									value={world.magic.limitations_and_costs}
									fullWidth
									multiline
									rows={3}
									onChange={(e) =>
										handleUpdateWorldData({
											magic: { ...world.magic!, limitations_and_costs: e.target.value },
										})
									}
								/>
								<TextField
									label="Отношение общества"
									value={world.magic.societal_attitude}
									fullWidth
									multiline
									rows={2}
									onChange={(e) =>
										handleUpdateWorldData({
											magic: { ...world.magic!, societal_attitude: e.target.value },
										})
									}
								/>

								{world.magic.magic_schools && world.magic.magic_schools.length > 0 && (
									<>
										<Typography variant="h6" sx={{ mt: 2 }}>
											Школы магии
										</Typography>
										{world.magic.magic_schools.map((school, idx) => (
											<Paper key={idx} sx={{ p: 2 }}>
												<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
													<TextField
														label="Название школы"
														value={school.name}
														fullWidth
														size="small"
														onChange={(e) => {
															const updated = [...world.magic!.magic_schools];
															updated[idx] = { ...updated[idx], name: e.target.value };
															handleUpdateWorldData({
																magic: { ...world.magic!, magic_schools: updated },
															});
														}}
													/>
													<TextField
														label="Описание"
														value={school.description}
														fullWidth
														multiline
														size="small"
														onChange={(e) => {
															const updated = [...world.magic!.magic_schools];
															updated[idx] = { ...updated[idx], description: e.target.value };
															handleUpdateWorldData({
																magic: { ...world.magic!, magic_schools: updated },
															});
														}}
													/>
												</Box>
											</Paper>
										))}
									</>
								)}
							</Box>
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




