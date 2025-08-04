import { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useUnit } from 'effector-react';
import { $currentStep, initializeAppNavigation, getCurrentScreen } from './model/app-navigation';
import { loadSettingsFx } from './model/settings';
import { WelcomeScreen } from './components/WelcomeScreen';
import { WorldCreation } from './components/world-creation';
import { WorldCreationNavigationProvider } from './components/world-creation/world-creation-navigation';

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
	const currentStep = useUnit($currentStep);
	const currentScreen = getCurrentScreen(currentStep);

	// Инициализация приложения
	useEffect(() => {
		loadSettingsFx();
		initializeAppNavigation();
	}, []);

	const renderScreen = () => {
		switch (currentScreen) {
			case 'welcome':
				return <WelcomeScreen />;
			case 'world-type-selection':
			case 'world-selection':
			case 'world-customization':
				return (
					<WorldCreationNavigationProvider>
						<WorldCreation />
					</WorldCreationNavigationProvider>
				);
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
