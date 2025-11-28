import React from 'react';
import {
	Box,
	Container,
	Typography,
	Button,
	Chip,
	Stack,
	Card,
	CardContent,
	IconButton,
	Tooltip,
	CircularProgress,
	Tabs,
	Tab,
} from '@mui/material';
import {
	ArrowBack,
	Public,
	Build,
	PlayArrow,
} from '@mui/icons-material';
import { useStore } from 'effector-react';
import { $selectedWorld } from '@model/game-sessions';
import { goToWelcome, goToChat, goToWorldPreparation } from '@model/app-navigation';
import { MainLayout, Sidebar } from '../layout';

import {
	Faction,
	Location,
	Race,
	TimelineEvent,
	MagicSystem,
} from '@shared/types/world-data';

// Компонент для отображения фракции
const FactionCard: React.FC<{ faction: Faction }> = ({ faction }) => (
	<Card variant="outlined" sx={{ mb: 2 }}>
		<CardContent>
			<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
				{faction.name}
			</Typography>
			<Chip label={faction.type} size="small" sx={{ mb: 2 }} />
			<Stack spacing={1.5}>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Идеология и цели
					</Typography>
					<Typography variant="body2">{faction.ideology_and_goals}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Структура
					</Typography>
					<Typography variant="body2">{faction.structure}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Ключевые лидеры
					</Typography>
					<Typography variant="body2">{faction.key_leaders}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Методы
					</Typography>
					<Typography variant="body2">{faction.methods}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Отношения
					</Typography>
					<Typography variant="body2">{faction.relationships}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Роль в конфликте
					</Typography>
					<Typography variant="body2">{faction.role_in_conflict}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Ресурсы и влияние
					</Typography>
					<Typography variant="body2">{faction.resources_and_influence}</Typography>
				</Box>
			</Stack>
		</CardContent>
	</Card>
);

// Компонент для отображения локации
const LocationCard: React.FC<{ location: Location }> = ({ location }) => (
	<Card variant="outlined" sx={{ mb: 2 }}>
		<CardContent>
			<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
				{location.name}
			</Typography>
			<Chip label={location.type} size="small" sx={{ mb: 2 }} />
			<Stack spacing={1.5}>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Внешний вид
					</Typography>
					<Typography variant="body2">{location.appearance}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						История
					</Typography>
					<Typography variant="body2">{location.history}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Обитатели
					</Typography>
					<Typography variant="body2">{location.inhabitants}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Значимость
					</Typography>
					<Typography variant="body2">{location.significance}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Особенности и секреты
					</Typography>
					<Typography variant="body2">{location.features_and_secrets}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Возможности для приключений
					</Typography>
					<Typography variant="body2">{location.adventure_opportunities}</Typography>
				</Box>
			</Stack>
		</CardContent>
	</Card>
);

// Компонент для отображения расы
const RaceCard: React.FC<{ race: Race }> = ({ race }) => (
	<Card variant="outlined" sx={{ mb: 2 }}>
		<CardContent>
			<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
				{race.name}
			</Typography>
			<Stack spacing={1.5}>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Описание
					</Typography>
					<Typography variant="body2">{race.description}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Отношение к конфликту
					</Typography>
					<Typography variant="body2">{race.relationship_to_conflict}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Особые способности
					</Typography>
					<Typography variant="body2">{race.special_abilities}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Социальная структура
					</Typography>
					<Typography variant="body2">{race.social_structure}</Typography>
				</Box>
			</Stack>
		</CardContent>
	</Card>
);

// Компонент для отображения события истории
const TimelineEventCard: React.FC<{ event: TimelineEvent }> = ({ event }) => (
	<Card variant="outlined" sx={{ mb: 2 }}>
		<CardContent>
			<Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					{event.name}
				</Typography>
				<Chip label={event.timeframe} size="small" color="primary" variant="outlined" />
			</Box>
			<Stack spacing={1.5}>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Описание
					</Typography>
					<Typography variant="body2">{event.description}</Typography>
				</Box>
				<Box>
					<Typography variant="subtitle2" color="text.secondary">
						Влияние на настоящее
					</Typography>
					<Typography variant="body2">{event.impact_on_present}</Typography>
				</Box>
			</Stack>
		</CardContent>
	</Card>
);

// Компонент для отображения магической системы
const MagicSystemCard: React.FC<{ magic: MagicSystem }> = ({ magic }) => (
	<Stack spacing={2}>
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Основы магии
				</Typography>
				<Typography variant="body2">{magic.magic_fundamentals}</Typography>
			</CardContent>
		</Card>
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Источники силы
				</Typography>
				<Typography variant="body2">{magic.power_sources}</Typography>
			</CardContent>
		</Card>
		{magic.magic_schools && magic.magic_schools.length > 0 && (
			<Card variant="outlined">
				<CardContent>
					<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
						Школы магии
					</Typography>
					<Stack spacing={1}>
						{magic.magic_schools.map((school, index) => (
							<Box key={index}>
								<Typography variant="subtitle2" color="primary.main">
									{school.name}
								</Typography>
								<Typography variant="body2">{school.description}</Typography>
							</Box>
						))}
					</Stack>
				</CardContent>
			</Card>
		)}
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Ограничения и цена
				</Typography>
				<Typography variant="body2">{magic.limitations_and_costs}</Typography>
			</CardContent>
		</Card>
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Отношение общества
				</Typography>
				<Typography variant="body2">{magic.societal_attitude}</Typography>
			</CardContent>
		</Card>
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Роль в конфликте
				</Typography>
				<Typography variant="body2">{magic.role_in_conflict}</Typography>
			</CardContent>
		</Card>
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
					Артефакты и места силы
				</Typography>
				<Typography variant="body2">{magic.artifacts_and_places}</Typography>
			</CardContent>
		</Card>
	</Stack>
);

export const WorldPreparationScreen: React.FC = () => {
	const selectedWorld = useStore($selectedWorld);
	const [activeTab, setActiveTab] = React.useState(0);

	const handleBack = () => {
		goToWelcome();
	};

	const handlePrepareWorld = () => {
		// TODO: Реализовать подготовку мира для игры
		console.log('Prepare world for game');
	};

	const handleStartGame = () => {
		goToChat();
	};

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	if (!selectedWorld) {
		return (
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	const { data } = selectedWorld;
	const hasFactions = data.factions && data.factions.length > 0;
	const hasLocations = data.locations && data.locations.length > 0;
	const hasRaces = data.races && data.races.length > 0;
	const hasHistory = data.history && data.history.length > 0;
	const hasMagic = !!data.magic;

	return (
		<MainLayout
			sidebar={<Sidebar onSelectWorld={(id) => goToWorldPreparation(id)} />}
			showSidebar={true}
			showRightPanel={false}
		>
			<Box sx={{ height: '100%', overflowY: 'auto' }}>
				{/* Шапка с кнопкой назад */}
				<Box
					sx={{
						position: 'sticky',
						top: 0,
						zIndex: 10,
						backgroundColor: 'rgba(15, 15, 15, 0.9)',
						backdropFilter: 'blur(10px)',
						borderBottom: '1px solid',
						borderColor: 'divider',
						py: 2,
					}}
				>
					<Container maxWidth="lg">
						<Box display="flex" alignItems="center" gap={2}>
							<Tooltip title="Назад">
								<IconButton onClick={handleBack}>
									<ArrowBack />
								</IconButton>
							</Tooltip>
							<Box sx={{ flex: 1 }}>
								<Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
									{selectedWorld.name}
								</Typography>
								<Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
									<Chip
										label={selectedWorld.genre}
										size="small"
										icon={<Public sx={{ fontSize: '0.875rem' }} />}
										variant="outlined"
										color="primary"
									/>
									<Chip
										label={selectedWorld.tone}
										size="small"
										variant="outlined"
										color="secondary"
									/>
								</Stack>
							</Box>
							<Stack direction="row" spacing={2}>
								<Button
									variant="outlined"
									startIcon={<Build />}
									onClick={handlePrepareWorld}
								>
									Подготовить
								</Button>
								<Button
									variant="contained"
									startIcon={<PlayArrow />}
									onClick={handleStartGame}
								>
									Играть
								</Button>
							</Stack>
						</Box>

						<Box sx={{ mt: 2 }}>
							<Tabs 
								value={activeTab} 
								onChange={handleTabChange} 
								variant="scrollable"
								scrollButtons="auto"
								textColor="primary"
								indicatorColor="primary"
							>
								<Tab label="Обзор" />
								{hasFactions && <Tab label={`Фракции (${data.factions!.length})`} />}
								{hasLocations && <Tab label={`Локации (${data.locations!.length})`} />}
								{hasRaces && <Tab label={`Расы (${data.races!.length})`} />}
								{hasHistory && <Tab label={`История (${data.history!.length})`} />}
								{hasMagic && <Tab label="Магия" />}
							</Tabs>
						</Box>
					</Container>
				</Box>

				<Container maxWidth="lg" sx={{ py: 4 }}>
					{/* Обзор */}
					{activeTab === 0 && (
						<Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
							<Card variant="outlined" sx={{ 
								background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
								backdropFilter: 'blur(10px)'
							}}>
								<CardContent sx={{ p: 4 }}>
									<Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
										Описание мира
									</Typography>
									<Typography
										variant="body1"
										sx={{ 
											lineHeight: 1.8, 
											whiteSpace: 'pre-wrap',
											fontSize: '1.1rem',
											color: 'text.primary'
										}}
									>
										{data.world_primer}
									</Typography>
								</CardContent>
							</Card>
						</Box>
					)}

					{/* Фракции */}
					{hasFactions && activeTab === 1 && (
						<Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
							<Stack spacing={3}>
								{data.factions!.map((faction, index) => (
									<FactionCard key={index} faction={faction} />
								))}
							</Stack>
						</Box>
					)}

					{/* Локации */}
					{hasLocations && activeTab === (hasFactions ? 2 : 1) && (
						<Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
							<Stack spacing={3}>
								{data.locations!.map((location, index) => (
									<LocationCard key={index} location={location} />
								))}
							</Stack>
						</Box>
					)}

					{/* Расы */}
					{hasRaces && activeTab === (hasFactions ? (hasLocations ? 3 : 2) : (hasLocations ? 2 : 1)) && (
						<Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
							<Stack spacing={3}>
								{data.races!.map((race, index) => (
									<RaceCard key={index} race={race} />
								))}
							</Stack>
						</Box>
					)}

					{/* История */}
					{hasHistory && activeTab === (hasFactions ? (hasLocations ? (hasRaces ? 4 : 3) : (hasRaces ? 3 : 2)) : (hasLocations ? (hasRaces ? 3 : 2) : (hasRaces ? 2 : 1))) && (
						<Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
							<Stack spacing={3}>
								{data.history!.map((event, index) => (
									<TimelineEventCard key={index} event={event} />
								))}
							</Stack>
						</Box>
					)}

					{/* Магия */}
					{hasMagic && activeTab === (hasFactions ? (hasLocations ? (hasRaces ? (hasHistory ? 5 : 4) : (hasHistory ? 4 : 3)) : (hasRaces ? (hasHistory ? 4 : 3) : (hasHistory ? 3 : 2))) : (hasLocations ? (hasRaces ? (hasHistory ? 4 : 3) : (hasHistory ? 3 : 2)) : (hasRaces ? (hasHistory ? 3 : 2) : (hasHistory ? 2 : 1)))) && (
						<Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
							<MagicSystemCard magic={data.magic!} />
						</Box>
					)}
				</Container>
			</Box>
		</MainLayout>
	);
};

