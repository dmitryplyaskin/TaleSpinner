import React, { useState, useEffect } from 'react';
import { useUnit } from 'effector-react';
import {
	Box,
	Typography,
	Button,
	CircularProgress,
	Paper,
	Divider,
	TextField,
	Alert,
	alpha,
	useTheme,
	Grid,
} from '@mui/material';
import {
	CheckCircle as CheckCircleIcon,
	Edit as EditIcon,
	Groups as GroupsIcon,
	Landscape as LandscapeIcon,
	Face as FaceIcon,
	HistoryEdu as HistoryIcon,
	AutoFixHigh as MagicIcon,
	Person as PersonIcon,
	Article as ArticleIcon,
} from '@mui/icons-material';
import { $clarificationRequest, $sessionId, $isContinuing, continueGenerationFx } from '../../model';

interface ModuleConfig {
	hasFactions: boolean;
	hasLocations: boolean;
	hasRaces: boolean;
	hasHistory: boolean;
	hasMagic: boolean;
	hasCharacters: boolean;
}

const MODULE_ICONS: Record<keyof ModuleConfig, React.ReactNode> = {
	hasFactions: <GroupsIcon fontSize="large" />,
	hasLocations: <LandscapeIcon fontSize="large" />,
	hasRaces: <FaceIcon fontSize="large" />,
	hasHistory: <HistoryIcon fontSize="large" />,
	hasMagic: <MagicIcon fontSize="large" />,
	hasCharacters: <PersonIcon fontSize="large" />,
};

const MODULE_LABELS: Record<keyof ModuleConfig, { label: string; description: string }> = {
	hasFactions: { label: 'Фракции и Политика', description: 'Гильдии, ордена, правительства' },
	hasLocations: { label: 'Локации и География', description: 'Города, руины, ландшафт' },
	hasRaces: { label: 'Расы и Виды', description: 'Эльфы, пришельцы, мутанты' },
	hasHistory: { label: 'История и Хронология', description: 'Важные события прошлого' },
	hasMagic: { label: 'Магия и Технологии', description: 'Магическая система или тех-уровень' },
	hasCharacters: { label: 'Ключевые Персонажи', description: 'Важные NPC' },
};

const ModuleCard = ({
	selected,
	onClick,
	icon,
	label,
	description,
	disabled,
}: {
	selected: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	label: string;
	description: string;
	disabled: boolean;
}) => {
	const theme = useTheme();

	return (
		<Paper
			elevation={selected ? 4 : 0}
			onClick={!disabled ? onClick : undefined}
			sx={{
				p: 3,
				height: '100%',
				cursor: disabled ? 'default' : 'pointer',
				border: '2px solid',
				borderColor: selected ? 'primary.main' : 'divider',
				bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
				transition: 'all 0.2s ease-in-out',
				opacity: disabled ? 0.5 : 1,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				textAlign: 'center',
				gap: 2,
				'&:hover': {
					borderColor: !disabled ? (selected ? 'primary.main' : 'text.secondary') : undefined,
					transform: !disabled ? 'translateY(-4px)' : 'none',
					boxShadow: !disabled ? (selected ? theme.shadows[8] : theme.shadows[2]) : undefined,
				},
			}}
		>
			<Box sx={{ color: selected ? 'primary.main' : 'text.secondary' }}>{icon}</Box>
			<Box>
				<Typography variant="h6" gutterBottom color={selected ? 'text.primary' : 'text.secondary'}>
					{label}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{description}
				</Typography>
			</Box>
			{selected && (
				<CheckCircleIcon
					color="primary"
					sx={{
						position: 'absolute',
						top: 8,
						right: 8,
						fontSize: 20,
					}}
				/>
			)}
		</Paper>
	);
};

export const SkeletonPreview: React.FC = () => {
	const request = useUnit($clarificationRequest);
	const sessionId = useUnit($sessionId);
	const isSubmitting = useUnit($isContinuing);
	const handleContinue = useUnit(continueGenerationFx);

	const [selectedModules, setSelectedModules] = useState<string[]>([]);
	const [feedback, setFeedback] = useState<string>('');

	// Parse skeleton from request
	const skeleton = React.useMemo(() => {
		if (!request) return null;

		// Extract skeleton info from description (it's in markdown format)
		const description = request.context.description;
		const titleMatch = description.match(/\*\*(.+?)\*\*/);
		const title = titleMatch ? titleMatch[1] : 'Черновик Мира';

		// Extract modules from defaults
		const modulesField = request.fields.find((f) => f.id === 'modules');
		const defaultModules = (modulesField?.defaultValue as string[]) || [];

		return {
			title,
			description,
			modules: defaultModules,
		};
	}, [request]);

	// Initialize selected modules from defaults
	useEffect(() => {
		if (skeleton) {
			setSelectedModules(skeleton.modules);
		}
	}, [skeleton]);

	if (!request || request.context.currentNode !== 'architect') {
		return null;
	}

	const handleModuleToggle = (moduleKey: string) => {
		setSelectedModules((prev) =>
			prev.includes(moduleKey) ? prev.filter((m) => m !== moduleKey) : [...prev, moduleKey],
		);
	};

	const handleApprove = () => {
		if (sessionId && request) {
			handleContinue({
				sessionId,
				response: {
					requestId: request.id,
					skipped: false,
					answers: {
						modules: selectedModules,
						feedback: feedback.trim(),
						action: 'approve',
					},
				},
			});
		}
	};

	const handleRefine = () => {
		if (sessionId && request) {
			handleContinue({
				sessionId,
				response: {
					requestId: request.id,
					skipped: false,
					answers: {
						modules: selectedModules,
						feedback: feedback.trim(),
						action: 'refine',
					},
				},
			});
		}
	};

	return (
		<Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
			{/* Header with Status */}
			<Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<Box>
					<Typography
						variant="h4"
						gutterBottom
						color="primary"
						sx={{ display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600 }}
					>
						<CheckCircleIcon fontSize="large" />
						Паспорт Мира
					</Typography>
					<Typography variant="body1" color="text.secondary">
						Концепция сформирована. Выберите модули для детальной генерации.
					</Typography>
				</Box>
			</Box>

			{/* Main Content Grid */}
			<Grid container spacing={4}>
				{/* Left Column: Skeleton Info */}
				<Grid size={{ xs: 12, md: 4 }}>
					<Paper
						elevation={0}
						sx={{
							p: 3,
							bgcolor: 'background.paper',
							border: '1px solid',
							borderColor: 'divider',
							height: '100%',
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: 'primary.main' }}>
							<ArticleIcon />
							<Typography variant="h6" fontWeight={600}>
								Концепция
							</Typography>
						</Box>

						<Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
							{skeleton?.title}
						</Typography>
						<Typography
							variant="body1"
							sx={{
								whiteSpace: 'pre-wrap',
								color: 'text.secondary',
								lineHeight: 1.6,
							}}
						>
							{request.context.description.replace(/\*\*(.+?)\*\*/g, '$1')}
						</Typography>

						<Divider sx={{ my: 3 }} />

						<Typography variant="subtitle2" gutterBottom color="text.secondary">
							Ваши комментарии к концепции:
						</Typography>
						<TextField
							fullWidth
							multiline
							rows={4}
							placeholder="Например: 'Сделай мир более мрачным' или 'Добавь больше политических интриг'"
							value={feedback}
							onChange={(e) => setFeedback(e.target.value)}
							disabled={isSubmitting}
							variant="outlined"
							size="small"
						/>
					</Paper>
				</Grid>

				{/* Right Column: Module Selection */}
				<Grid size={{ xs: 12, md: 8 }}>
					<Box sx={{ mb: 4 }}>
						<Typography
							variant="h5"
							gutterBottom
							sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}
						>
							Модули генерации
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
							Отметьте аспекты, которые необходимо проработать детально
						</Typography>

						<Grid container spacing={2}>
							{Object.entries(MODULE_LABELS).map(([key, { label, description }]) => (
								<Grid size={{ xs: 12, sm: 6 }} key={key}>
									<ModuleCard
										selected={selectedModules.includes(key)}
										onClick={() => handleModuleToggle(key)}
										icon={MODULE_ICONS[key as keyof ModuleConfig]}
										label={label}
										description={description}
										disabled={isSubmitting}
									/>
								</Grid>
							))}
						</Grid>

						{selectedModules.length === 0 && (
							<Alert severity="warning" sx={{ mt: 3 }}>
								Необходимо выбрать хотя бы один модуль для генерации!
							</Alert>
						)}
					</Box>

					<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
						<Button
							variant="outlined"
							size="large"
							onClick={handleRefine}
							disabled={isSubmitting}
							startIcon={<EditIcon />}
							sx={{ px: 3 }}
						>
							Доработать концепцию
						</Button>
						<Button
							variant="contained"
							size="large"
							onClick={handleApprove}
							disabled={isSubmitting || selectedModules.length === 0}
							startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
							sx={{ px: 4 }}
						>
							{isSubmitting ? 'Генерация...' : 'Утвердить и Создать'}
						</Button>
					</Box>
				</Grid>
			</Grid>
		</Box>
	);
};
