import React, { useState } from 'react';
import {
	Container,
	Typography,
	TextField,
	Card,
	CardContent,
	Button,
	Box,
	IconButton,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Chip,
	Avatar,
} from '@mui/material';
import { ArrowBack, Person } from '@mui/icons-material';
import { useUnit } from 'effector-react';
import { goBack, $selectedWorld } from '../model/navigation';

export const CharacterCreationScreen: React.FC = () => {
	const selectedWorld = useUnit($selectedWorld);
	const [characterName, setCharacterName] = useState('');
	const [characterClass, setCharacterClass] = useState('');
	const [characterRace, setCharacterRace] = useState('');
	const [characterBackground, setCharacterBackground] = useState('');

	const handleGoBack = () => {
		goBack();
	};

	const handleCreateCharacter = () => {
		console.log('Создание персонажа:', {
			name: characterName,
			class: characterClass,
			race: characterRace,
			background: characterBackground,
			world: selectedWorld,
		});
	};

	const getWorldName = (world: string | null) => {
		switch (world) {
			case 'fantasy':
				return 'Фэнтези';
			case 'cyberpunk':
				return 'Киберпанк';
			case 'everyday':
				return 'Повседневный';
			case 'custom':
				return 'Пользовательский';
			default:
				return 'Неизвестный';
		}
	};

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<Box display="flex" alignItems="center" gap={2} mb={4}>
				<IconButton onClick={handleGoBack} size="large">
					<ArrowBack />
				</IconButton>
				<Typography variant="h4" component="h1">
					Создание персонажа
				</Typography>
			</Box>

			<Box display="flex" alignItems="center" gap={2} mb={4}>
				<Typography variant="h6">Мир:</Typography>
				<Chip label={getWorldName(selectedWorld)} color="primary" variant="outlined" />
			</Box>

			<Card sx={{ mb: 4 }}>
				<CardContent>
					<Box display="flex" flexDirection="column" gap={3}>
						<Box display="flex" alignItems="center" gap={3} mb={3}>
							<Avatar sx={{ width: 80, height: 80 }}>
								<Person fontSize="large" />
							</Avatar>
							<Typography variant="h6" color="text.secondary">
								Загрузить аватар (позже)
							</Typography>
						</Box>

						<TextField
							label="Имя персонажа"
							value={characterName}
							onChange={(e) => setCharacterName(e.target.value)}
							fullWidth
							variant="outlined"
						/>

						<Box display="flex" gap={2}>
							<FormControl fullWidth>
								<InputLabel>Класс</InputLabel>
								<Select value={characterClass} label="Класс" onChange={(e) => setCharacterClass(e.target.value)}>
									{selectedWorld === 'fantasy' && [
										<MenuItem key="warrior" value="warrior">
											Воин
										</MenuItem>,
										<MenuItem key="mage" value="mage">
											Маг
										</MenuItem>,
										<MenuItem key="rogue" value="rogue">
											Плут
										</MenuItem>,
										<MenuItem key="cleric" value="cleric">
											Жрец
										</MenuItem>,
									]}
									{selectedWorld === 'cyberpunk' && [
										<MenuItem key="netrunner" value="netrunner">
											Нетраннер
										</MenuItem>,
										<MenuItem key="solo" value="solo">
											Соло
										</MenuItem>,
										<MenuItem key="techie" value="techie">
											Техник
										</MenuItem>,
										<MenuItem key="corpo" value="corpo">
											Корпорат
										</MenuItem>,
									]}
									{selectedWorld === 'everyday' && [
										<MenuItem key="student" value="student">
											Студент
										</MenuItem>,
										<MenuItem key="worker" value="worker">
											Рабочий
										</MenuItem>,
										<MenuItem key="detective" value="detective">
											Детектив
										</MenuItem>,
										<MenuItem key="journalist" value="journalist">
											Журналист
										</MenuItem>,
									]}
								</Select>
							</FormControl>

							<FormControl fullWidth>
								<InputLabel>Раса/Происхождение</InputLabel>
								<Select
									value={characterRace}
									label="Раса/Происхождение"
									onChange={(e) => setCharacterRace(e.target.value)}
								>
									{selectedWorld === 'fantasy' && [
										<MenuItem key="human" value="human">
											Человек
										</MenuItem>,
										<MenuItem key="elf" value="elf">
											Эльф
										</MenuItem>,
										<MenuItem key="dwarf" value="dwarf">
											Дварф
										</MenuItem>,
										<MenuItem key="halfling" value="halfling">
											Полурослик
										</MenuItem>,
									]}
									{selectedWorld === 'cyberpunk' && [
										<MenuItem key="human" value="human">
											Человек
										</MenuItem>,
										<MenuItem key="cyborg" value="cyborg">
											Киборг
										</MenuItem>,
										<MenuItem key="ai" value="ai">
											ИИ
										</MenuItem>,
									]}
									{selectedWorld === 'everyday' && [
										<MenuItem key="human" value="human">
											Человек
										</MenuItem>,
									]}
								</Select>
							</FormControl>
						</Box>

						<TextField
							label="Предыстория"
							value={characterBackground}
							onChange={(e) => setCharacterBackground(e.target.value)}
							multiline
							rows={4}
							fullWidth
							variant="outlined"
							placeholder="Расскажите о прошлом вашего персонажа..."
						/>
					</Box>
				</CardContent>
			</Card>

			<Box display="flex" justifyContent="center" gap={2}>
				<Button variant="outlined" onClick={handleGoBack}>
					Назад
				</Button>
				<Button
					variant="contained"
					size="large"
					onClick={handleCreateCharacter}
					disabled={!characterName || !characterClass}
				>
					Создать персонажа
				</Button>
			</Box>
		</Container>
	);
};
