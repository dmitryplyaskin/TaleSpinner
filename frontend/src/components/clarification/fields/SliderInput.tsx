import type { ClarificationField } from "@shared/types/human-in-the-loop";

interface SliderInputProps {
  field: ClarificationField;
  value: number;
  onChange: (value: number) => void;
}

export function SliderInput({ field, value, onChange }: SliderInputProps) {
  const min = field.validation?.min ?? 1;
  const max = field.validation?.max ?? 10;
  const currentValue = value ?? Math.floor((min + max) / 2);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-[var(--color-text-secondary)]">{min}</span>
        <span className="text-lg font-semibold text-[var(--color-accent)]">
          {currentValue}
        </span>
        <span className="text-sm text-[var(--color-text-secondary)]">{max}</span>
      </div>
      <input
        type="range"
        id={field.id}
        min={min}
        max={max}
        value={currentValue}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 bg-[var(--color-surface)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
        style={{
          background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${((currentValue - min) / (max - min)) * 100}%, var(--color-surface) ${((currentValue - min) / (max - min)) * 100}%, var(--color-surface) 100%)`,
        }}
      />
    </div>
  );
}



