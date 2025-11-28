import { ReactNode } from 'react';

export type GenreId = 'adventure' | 'mystery' | 'drama' | 'action' | 'horror' | 'romance';

export interface GenreOption {
	id: GenreId;
	icon: ReactNode;
	gradient: string;
	accentColor: string;
	iconBg: string;
}

