import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useUnit } from 'effector-react';
import { $currentStep, initializeAppNavigation, getCurrentScreen } from './model/app-navigation';
import { loadSettingsFx, SettingsDrawer } from './features/settings';
import { WelcomeScreen } from './components/welcome-screen';
import { Wizard } from './features/world-creation';
import { ChatPage } from './components/chat';
import { WorldPreparationScreen } from './components/world-preparation';
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
			case 'world-preparation':
				return <WorldPreparationScreen />;
			case 'chat':
				return <ChatPage />;
			case 'agent-wizard':
				return <Wizard />;
			default:
				return <WelcomeScreen />;
		}
	};

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			{renderScreen()}
			<SettingsDrawer />
		</ThemeProvider>
	);
}

export default App;
