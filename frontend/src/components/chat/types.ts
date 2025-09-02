export interface ChatMessage {
	id: string;
	type: 'user' | 'ai' | 'system';
	content: string;
	timestamp: Date;
	avatar?: string;
	username?: string;
}

export interface ChatState {
	messages: ChatMessage[];
	isTyping: boolean;
	inputValue: string;
}

export interface MessageBubbleProps {
	message: ChatMessage;
}

export interface ChatInputProps {
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
	disabled?: boolean;
	placeholder?: string;
}

export interface ChatHeaderProps {
	title?: string;
	subtitle?: string;
	onBack?: () => void;
}

export interface TypingIndicatorProps {
	username?: string;
	avatar?: React.ReactNode;
}
