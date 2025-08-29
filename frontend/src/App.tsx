import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useUnit } from 'effector-react';
import { $currentStep, initializeAppNavigation, getCurrentScreen } from './model/app-navigation';
import { loadSettingsFx } from './model/settings';
import { WelcomeScreen } from './components/welcome-screen';
import { WorldCreation } from './components/world-creation';
import { WorldCreationNavigationProvider } from './components/world-creation/navigation/navigation';
import { theme } from './theme';

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
			case 'world-primer-edit':
			case 'character-creation':
			case 'world-completion':
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
