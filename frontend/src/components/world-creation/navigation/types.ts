export interface StepConfig {
	id: string;
	label: string;
	description?: string;
	completed?: boolean;
	disabled?: boolean;
}

export interface WorldCreationStep {
	id: string;
	component: React.ComponentType;
	label: string;
	description?: string;
}
