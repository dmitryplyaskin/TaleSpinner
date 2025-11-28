import React, { ReactNode } from 'react';
import { Box } from '@mui/material';

interface MainLayoutProps {
	sidebar?: ReactNode;
	children: ReactNode;
	rightPanel?: ReactNode;
	showSidebar?: boolean;
	showRightPanel?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
	sidebar,
	children,
	rightPanel,
	showSidebar = true,
	showRightPanel = false,
}) => {
	return (
		<Box
			sx={{
				display: 'flex',
				width: '100vw',
				height: '100vh',
				overflow: 'hidden',
				position: 'relative',
			}}
		>
			{/* Левая боковая панель */}
			{showSidebar && sidebar && (
				<Box
					sx={{
						width: 'var(--sidebar-width)',
						flexShrink: 0,
						height: '100vh',
						position: 'relative',
						zIndex: 10,
					}}
					className="sidebar-panel"
				>
					{sidebar}
				</Box>
			)}

			{/* Основная область контента */}
			<Box
				className="main-content-area"
				sx={{
					flex: 1,
					height: '100vh',
					overflow: 'hidden',
					position: 'relative',
					zIndex: 1,
				}}
			>
				{children}
			</Box>

			{/* Правая информационная панель */}
			{showRightPanel && rightPanel && (
				<Box
					sx={{
						width: 'var(--right-panel-width)',
						flexShrink: 0,
						height: '100vh',
						position: 'relative',
						zIndex: 10,
					}}
					className="right-info-panel"
				>
					{rightPanel}
				</Box>
			)}
		</Box>
	);
};
