import React, { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useUnit } from 'effector-react';
import { $currentScreen, ROUTES } from './model/navigation_old';
import { loadSettingsFx } from './model/settings';
import { WelcomeScreen } from './components/WelcomeScreen';
import { WorldSelectionScreen } from './components/WorldSelectionScreen';
import { CharacterCreationScreen } from './components/CharacterCreationScreen';
import { CreateWorld } from './components/world-creation/select-world';

const theme = createTheme({
	palette: {
		mode: 'dark',
		primary: {
			main: '#9c27b0',
		},
		secondary: {
			main: '#f50057',
		},
		background: {
			default: '#121212',
			paper: '#1e1e1e',
		},
	},
	typography: {
		fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
	},
});

function App() {
	const currentScreen = useUnit($currentScreen);

	// Загружаем настройки при инициализации приложения
	useEffect(() => {
		loadSettingsFx();
	}, []);

	const renderScreen = () => {
		switch (currentScreen) {
			case ROUTES.WELCOME:
				return <WelcomeScreen />;
			case ROUTES.WORLD_SELECTION:
				return <WorldSelectionScreen />;
			case ROUTES.CHARACTER_CREATION:
				return <CharacterCreationScreen />;
			case ROUTES.CREATE_WORLD:
				return <CreateWorld />;
			default:
				return <WelcomeScreen />;
		}
	};

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			{renderScreen()}
		</ThemeProvider>
	);
}

export default App;
