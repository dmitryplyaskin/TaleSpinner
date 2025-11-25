import { useState, useMemo } from "react";
import type {
  ClarificationRequest,
  ClarificationResponse,
  ClarificationField,
} from "@shared/types/human-in-the-loop";
import {
  TextInput,
  TextareaInput,
  SliderInput,
  RadioGroup,
  SelectInput,
  MultiSelectInput,
  CheckboxGroup,
  ConfirmToggle,
} from "./fields";

interface ClarificationRendererProps {
  request: ClarificationRequest;
  onSubmit: (response: ClarificationResponse) => void;
  onSkip?: () => void;
}

type FieldValue = string | string[] | boolean | number;

export function ClarificationRenderer({
  request,
  onSubmit,
  onSkip,
}: ClarificationRendererProps) {
  const [values, setValues] = useState<Record<string, FieldValue>>(() => {
    // Инициализация значениями по умолчанию
    const defaults: Record<string, FieldValue> = {};
    request.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.id] = field.defaultValue;
      }
    });
    return defaults;
  });

  // Фильтрация полей с учётом conditional
  const visibleFields = useMemo(() => {
    return request.fields.filter((field) => {
      if (!field.conditional) return true;
      const dependsValue = values[field.conditional.dependsOn];
      return field.conditional.showWhen.includes(String(dependsValue));
    });
  }, [request.fields, values]);

  const handleChange = (fieldId: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = () => {
    onSubmit({
      requestId: request.id,
      skipped: false,
      answers: values,
    });
  };

  const handleSkip = () => {
    onSubmit({
      requestId: request.id,
      skipped: true,
      answers: {},
    });
    onSkip?.();
  };

  // Рендеринг поля по типу
  const renderField = (field: ClarificationField) => {
    switch (field.type) {
      case "text":
        return (
          <TextInput
            field={field}
            value={values[field.id] as string}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "textarea":
        return (
          <TextareaInput
            field={field}
            value={values[field.id] as string}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "slider":
        return (
          <SliderInput
            field={field}
            value={values[field.id] as number}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "radio":
        return (
          <RadioGroup
            field={field}
            value={values[field.id] as string}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "confirm":
        return (
          <ConfirmToggle
            field={field}
            value={values[field.id] as boolean}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "select":
        return (
          <SelectInput
            field={field}
            value={values[field.id] as string}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "multiselect":
        return (
          <MultiSelectInput
            field={field}
            value={values[field.id] as string[]}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      case "checkbox":
        return (
          <CheckboxGroup
            field={field}
            value={values[field.id] as string[]}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
      default:
        return (
          <TextInput
            field={field}
            value={values[field.id] as string}
            onChange={(v) => handleChange(field.id, v)}
          />
        );
    }
  };

  // Определяем цвет бейджа по impact
  const impactColors = {
    minor: "bg-green-500/20 text-green-400 border-green-500/30",
    moderate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    significant: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 px-6 py-5 border-b border-[var(--color-border)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              {request.context.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-1">
              {request.context.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30">
              {request.context.currentNode}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${impactColors[request.meta.estimatedImpact]}`}
            >
              {request.meta.estimatedImpact}
            </span>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="px-6 py-4 bg-[var(--color-surface)]/50 border-b border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-text-primary)]">Причина: </span>
          {request.context.reason}
        </p>
      </div>

      {/* Fields */}
      <div className="px-6 py-6 space-y-6">
        {visibleFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <label
              htmlFor={field.id}
              className="block text-[var(--color-text-primary)] font-medium"
            >
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {field.description && (
              <p className="text-sm text-[var(--color-text-secondary)]">
                {field.description}
              </p>
            )}
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-[var(--color-surface)]/30 border-t border-[var(--color-border)] flex justify-between items-center gap-4">
        {request.options.allowSkip && (
          <button
            type="button"
            onClick={handleSkip}
            className="px-5 py-2.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all"
          >
            {request.options.skipLabel || "Пропустить"}
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          className="ml-auto px-6 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent)]/90 transition-all shadow-lg shadow-[var(--color-accent)]/25"
        >
          {request.options.submitLabel}
        </button>
      </div>
    </div>
  );
}

