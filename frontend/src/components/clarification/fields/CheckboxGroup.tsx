import type { ClarificationField } from "@shared/types/human-in-the-loop";

interface CheckboxGroupProps {
  field: ClarificationField;
  value: string[];
  onChange: (value: string[]) => void;
}

export function CheckboxGroup({ field, value, onChange }: CheckboxGroupProps) {
  const selectedValues = value || [];

  const handleToggle = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {field.options?.map((option) => (
        <label
          key={option.value}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all ${
            selectedValues.includes(option.value)
              ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/50"
          }`}
        >
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={() => handleToggle(option.value)}
            className="sr-only"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

