import React from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Typography,
	TextField,
	Chip,
	Tabs,
	Tab,
	Switch,
	FormControlLabel,
	IconButton,
	Tooltip,
	Divider,
} from '@mui/material';
import { Settings, Favorite, Share } from '@mui/icons-material';

export const ThemeDemo: React.FC = () => {
	const [tabValue, setTabValue] = React.useState(0);
	const [switchValue, setSwitchValue] = React.useState(false);

	return (
		<Box sx={{ p: 4, minHeight: '100vh' }}>
			<Typography variant="h1" gutterBottom className="shimmer-text">
				🏰 TaleSpinner
			</Typography>

			<Typography variant="h2" gutterBottom>
				Демонстрация темы
			</Typography>

			<Typography variant="body1" paragraph>
				Добро пожаловать в мир ролевых приключений! Эта тема создана специально для погружения в атмосферу фэнтези и
				средневековых сказаний. Шрифты оптимизированы для отличной читаемости кириллицы и латиницы, кнопки читаемы во
				всех состояниях.
			</Typography>

			<Typography
				variant="body2"
				paragraph
				sx={{ fontWeight: 500, background: 'rgba(212, 175, 55, 0.1)', p: 2, borderRadius: 2 }}
			>
				<strong>Тест кириллицы:</strong> АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ абвгдежзийклмнопрстуфхцчшщъыьэюя
			</Typography>

			<Typography
				variant="body2"
				paragraph
				sx={{ fontWeight: 500, background: 'rgba(212, 175, 55, 0.1)', p: 2, borderRadius: 2 }}
			>
				<strong>Test Latin:</strong> ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz
			</Typography>

			<Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
				{/* Кнопки */}
				<Card className="parchment-effect">
					<CardContent>
						<Typography variant="h4" gutterBottom>
							Кнопки
						</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							<Button variant="contained">Начать приключение</Button>
							<Button variant="outlined">Загрузить игру</Button>
							<Button variant="text">Настройки</Button>
							<Button variant="contained" disabled>
								Заблокированная кнопка
							</Button>
							<Button variant="outlined" disabled>
								Недоступно
							</Button>
						</Box>
					</CardContent>
				</Card>

				{/* Типографика */}
				<Card className="parchment-effect">
					<CardContent>
						<Typography variant="h4" gutterBottom>
							Типографика
						</Typography>
						<Typography variant="h5">Заголовок H5</Typography>
						<Typography variant="h6" gutterBottom>
							Заголовок H6
						</Typography>
						<Typography variant="subtitle1">Подзаголовок 1</Typography>
						<Typography variant="subtitle2" gutterBottom>
							Подзаголовок 2
						</Typography>
						<Typography variant="body1">Основной текст с поддержкой русского языка и English text.</Typography>
						<Typography variant="body2" gutterBottom>
							Дополнительный текст меньшего размера.
						</Typography>
						<Typography variant="caption" display="block">
							Подпись или примечание
						</Typography>
					</CardContent>
				</Card>

				{/* Формы */}
				<Card className="parchment-effect">
					<CardContent>
						<Typography variant="h4" gutterBottom>
							Формы
						</Typography>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							<TextField label="Имя персонажа" variant="outlined" placeholder="Введите имя героя" />
							<TextField
								label="Описание"
								variant="outlined"
								multiline
								rows={3}
								placeholder="Опишите своего персонажа..."
							/>
							<FormControlLabel
								control={<Switch checked={switchValue} onChange={(e) => setSwitchValue(e.target.checked)} />}
								label="Включить магию"
							/>
						</Box>
					</CardContent>
				</Card>

				{/* Интерактивные элементы */}
				<Card className="parchment-effect">
					<CardContent>
						<Typography variant="h4" gutterBottom>
							Интерактивные элементы
						</Typography>

						<Box sx={{ mb: 3 }}>
							<Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
								<Tab label="Персонаж" />
								<Tab label="Инвентарь" />
								<Tab label="Заклинания" />
							</Tabs>
						</Box>

						<Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
							<Chip label="Воин" />
							<Chip label="Маг" />
							<Chip label="Лучник" />
							<Chip label="Вор" clickable />
						</Box>

						<Box sx={{ display: 'flex', gap: 1 }}>
							<Tooltip title="Настройки персонажа">
								<IconButton>
									<Settings />
								</IconButton>
							</Tooltip>
							<Tooltip title="Добавить в избранное">
								<IconButton>
									<Favorite />
								</IconButton>
							</Tooltip>
							<Tooltip title="Поделиться">
								<IconButton>
									<Share />
								</IconButton>
							</Tooltip>
						</Box>
					</CardContent>
				</Card>
			</Box>

			<Divider sx={{ my: 4 }} />

			<Typography variant="h3" gutterBottom className="text-gold">
				Особенности темы
			</Typography>

			<Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
				<Box className="fade-in">
					<Typography variant="h6" className="text-gold">
						✨ Поддержка кириллицы
					</Typography>
					<Typography variant="body2">Все шрифты корректно отображают русский и английский текст</Typography>
				</Box>

				<Box className="fade-in">
					<Typography variant="h6" className="text-gold">
						🎨 Читаемые кнопки
					</Typography>
					<Typography variant="body2">
						Текст в кнопках читаем во всех состояниях: обычном, при наведении, фокусе и отключенном
					</Typography>
				</Box>

				<Box className="fade-in">
					<Typography variant="h6" className="text-gold">
						📁 Модульная структура
					</Typography>
					<Typography variant="body2">Тема разделена на отдельные файлы для удобства разработки и поддержки</Typography>
				</Box>

				<Box className="fade-in">
					<Typography variant="h6" className="text-gold">
						🏰 Фэнтези атмосфера
					</Typography>
					<Typography variant="body2">
						Золотистые акценты, темная палитра и эффекты создают атмосферу средневекового фэнтези
					</Typography>
				</Box>
			</Box>
		</Box>
	);
};
