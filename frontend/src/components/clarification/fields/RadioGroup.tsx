import type { ClarificationField } from "@shared/types/human-in-the-loop";

interface RadioGroupProps {
  field: ClarificationField;
  value: string;
  onChange: (value: string) => void;
}

export function RadioGroup({ field, value, onChange }: RadioGroupProps) {
  return (
    <div className="space-y-3">
      {field.options?.map((option) => (
        <label
          key={option.value}
          className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
            value === option.value
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50"
          }`}
        >
          <input
            type="radio"
            name={field.id}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-1 w-4 h-4 accent-[var(--color-accent)]"
          />
          <div className="flex-1">
            <span className="text-[var(--color-text-primary)] font-medium">
              {option.label}
            </span>
            {option.description && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {option.description}
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}



