import type { ClarificationField } from '@shared/types/human-in-the-loop';

interface ConfirmToggleProps {
	field: ClarificationField;
	value: boolean;
	onChange: (value: boolean) => void;
}

export function ConfirmToggle({ field, value, onChange }: ConfirmToggleProps) {
	const isChecked = value ?? false;

	return (
		<div className="flex items-center gap-4">
			<button
				type="button"
				onClick={() => onChange(!isChecked)}
				className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
					isChecked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
				}`}
				role="switch"
				aria-checked={isChecked}
				aria-labelledby={`${field.id}-label`}
			>
				<span
					className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
						isChecked ? 'translate-x-8' : 'translate-x-1'
					}`}
				/>
			</button>
			<span id={`${field.id}-label`} className="text-[var(--color-text-primary)] font-medium">
				{isChecked ? 'Да' : 'Нет'}
			</span>
		</div>
	);
}
