import type { ClarificationField } from "@shared/types/human-in-the-loop";

interface MultiSelectInputProps {
  field: ClarificationField;
  value: string[];
  onChange: (value: string[]) => void;
}

export function MultiSelectInput({ field, value, onChange }: MultiSelectInputProps) {
  const selectedValues = value || [];

  const handleToggle = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="space-y-2">
      {field.options?.map((option) => (
        <label
          key={option.value}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            selectedValues.includes(option.value)
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50"
          }`}
        >
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={() => handleToggle(option.value)}
            className="mt-1 w-4 h-4 accent-[var(--color-accent)]"
          />
          <div className="flex-1">
            <span className="text-[var(--color-text-primary)]">{option.label}</span>
            {option.description && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                {option.description}
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}



