import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  description?: string;
  error?: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function FormField({ label, description, error, hint, actions, children }: FormFieldProps) {
  return (
    <label className={`form-field${error ? " is-invalid" : ""}`}>
      <span className="form-field-header">
        <span className="form-field-label">{label}</span>
        {actions ? <span className="form-field-actions">{actions}</span> : null}
      </span>
      {description ? <span className="form-field-description">{description}</span> : null}
      {children}
      {error ? <span className="form-field-error">{error}</span> : null}
      {!error && hint ? <span className="form-field-hint">{hint}</span> : null}
    </label>
  );
}
