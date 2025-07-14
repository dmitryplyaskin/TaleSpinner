import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useUnit } from 'effector-react';
import { $currentScreen } from './model/navigation';
import { WelcomeScreen } from './components/WelcomeScreen';
import { WorldSelectionScreen } from './components/WorldSelectionScreen';
import { CharacterCreationScreen } from './components/CharacterCreationScreen';

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

	const renderScreen = () => {
		switch (currentScreen) {
			case 'welcome':
				return <WelcomeScreen />;
			case 'world-selection':
				return <WorldSelectionScreen />;
			case 'character-creation':
				return <CharacterCreationScreen />;
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
