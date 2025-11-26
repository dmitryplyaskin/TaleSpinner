import type { ClarificationField } from '@shared/types/human-in-the-loop';

interface TextInputProps {
	field: ClarificationField;
	value: string;
	onChange: (value: string) => void;
}

export function TextInput({ field, value, onChange }: TextInputProps) {
	return (
		<input
			type="text"
			id={field.id}
			value={value || ''}
			onChange={(e) => onChange(e.target.value)}
			placeholder={field.placeholder}
			minLength={field.validation?.minLength}
			maxLength={field.validation?.maxLength}
			required={field.required}
			className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
		/>
	);
}
