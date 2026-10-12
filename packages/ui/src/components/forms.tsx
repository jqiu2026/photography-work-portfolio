"use client";

import { Checkbox as RCheckbox, RadioGroup as RRadio, Slider as RSlider, Switch as RSwitch } from "radix-ui";
import { Check } from "lucide-react";
import { createContext, useContext, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cx } from "./cx";

type FieldCtx = { id: string; describedBy?: string; invalid: boolean };
const FieldContext = createContext<FieldCtx | null>(null);

/** Label + hint + error wrapper. Controls inside inherit id, aria-describedby and aria-invalid. */
export function Field({ label, hint, error, required, children, className }: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode; className?: string }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: !!error }}>
      <div className={cx("ph-field", className)}>
        <label htmlFor={id} className="ph-field__label">
          {label}
          {required ? <span aria-hidden> *</span> : null}
        </label>
        {children}
        {hint ? <p id={`${id}-hint`} className="ph-field__hint">{hint}</p> : null}
        {error ? <p id={`${id}-error`} className="ph-field__error" role="alert">{error}</p> : null}
      </div>
    </FieldContext.Provider>
  );
}

function useField() {
  return useContext(FieldContext);
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  const f = useField();
  return <input id={f?.id} aria-describedby={f?.describedBy} aria-invalid={f?.invalid || undefined} className={cx("ph-input", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const f = useField();
  return <textarea id={f?.id} aria-describedby={f?.describedBy} aria-invalid={f?.invalid || undefined} className={cx("ph-input ph-textarea", className)} {...rest} />;
}

/** Native select (best accessibility and mobile behaviour), styled to match. */
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  const f = useField();
  return (
    <select id={f?.id} aria-describedby={f?.describedBy} aria-invalid={f?.invalid || undefined} className={cx("ph-input ph-select", className)} {...rest}>
      {children}
    </select>
  );
}

export function Checkbox({ label, className, ...rest }: { label: ReactNode; className?: string } & RCheckbox.CheckboxProps) {
  const id = useId();
  return (
    <div className={cx("ph-check", className)}>
      <RCheckbox.Root id={id} className="ph-check__box" {...rest}>
        <RCheckbox.Indicator><Check size={14} aria-hidden /></RCheckbox.Indicator>
      </RCheckbox.Root>
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function Switch({ label, className, ...rest }: { label: ReactNode; className?: string } & RSwitch.SwitchProps) {
  const id = useId();
  return (
    <div className={cx("ph-check", className)}>
      <RSwitch.Root id={id} className="ph-switch" {...rest}>
        <RSwitch.Thumb className="ph-switch__thumb" />
      </RSwitch.Root>
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function RadioGroup({ options, className, ...rest }: { options: { value: string; label: ReactNode }[]; className?: string } & RRadio.RadioGroupProps) {
  const id = useId();
  return (
    <RRadio.Root className={cx("ph-radio-group", className)} {...rest}>
      {options.map((o) => (
        <div className="ph-check" key={o.value}>
          <RRadio.Item id={`${id}-${o.value}`} value={o.value} className="ph-check__box ph-check__box--round">
            <RRadio.Indicator className="ph-radio__dot" />
          </RRadio.Item>
          <label htmlFor={`${id}-${o.value}`}>{o.label}</label>
        </div>
      ))}
    </RRadio.Root>
  );
}

export function Slider({ label, className, ...rest }: { label: string; className?: string } & RSlider.SliderProps) {
  const n = (rest.value ?? rest.defaultValue ?? [0]).length;
  return (
    <RSlider.Root className={cx("ph-slider", className)} {...rest}>
      <RSlider.Track className="ph-slider__track"><RSlider.Range className="ph-slider__range" /></RSlider.Track>
      {Array.from({ length: n }, (_, i) => <RSlider.Thumb key={i} aria-label={label} className="ph-slider__thumb" />)}
    </RSlider.Root>
  );
}
