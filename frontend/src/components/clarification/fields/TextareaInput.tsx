import type { ClarificationField } from "@shared/types/human-in-the-loop";

interface TextareaInputProps {
  field: ClarificationField;
  value: string;
  onChange: (value: string) => void;
}

export function TextareaInput({ field, value, onChange }: TextareaInputProps) {
  return (
    <textarea
      id={field.id}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      minLength={field.validation?.minLength}
      maxLength={field.validation?.maxLength}
      required={field.required}
      rows={4}
      className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all resize-y min-h-[100px]"
    />
  );
}



