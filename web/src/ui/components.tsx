import { useCallback, useId, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { isCountValid, isDecimalValid, parseCount } from '../data/units';
import { t } from './i18n';
import { Icon, type IconName } from './Icon';

export function useBack(fallback: string): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    const index = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (index > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [navigate, fallback]);
}

export function IconButton({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button type="button" className="icon-button" aria-label={label} title={label} onClick={onClick}>
      <Icon name={icon} />
    </button>
  );
}

interface ScreenProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
  fab?: ReactNode;
  children?: ReactNode;
}

export function Screen({ title, subtitle, onBack, actions, fab, children }: ScreenProps) {
  return (
    <div className={fab ? 'screen with-fab' : 'screen'}>
      <header className="topbar">
        {onBack && <IconButton icon="back" label={t.back} onClick={onBack} />}
        <div className="topbar-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="topbar-actions">{actions}</div>
      </header>
      <main className="content">{children}</main>
      {fab}
    </div>
  );
}

export function Fab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="fab" onClick={onClick}>
      <Icon name="add" />
      <span>{label}</span>
    </button>
  );
}

export function TextAction({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="text-action" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="card section">
      <div className="section-head">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="value-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="empty-state">{text}</p>;
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="field-row">{children}</div>;
}

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: boolean; children: ReactNode }) {
  return (
    <div className={error ? 'field error' : 'field'}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  error?: boolean;
}

export function TextField({ label, value, onChange, placeholder, multiline, error }: TextFieldProps) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} error={error}>
      {multiline ? (
        <textarea id={id} value={value} placeholder={placeholder} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          autoCapitalize="sentences"
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  allowNegative?: boolean;
  integer?: boolean;
}

export function NumberField({ label, value, onChange, suffix, allowNegative, integer }: NumberFieldProps) {
  const id = useId();
  const valid = integer ? isCountValid(value) : isDecimalValid(value, allowNegative);
  const toggleSign = () => onChange(value.trim().startsWith('-') ? value.trim().slice(1) : `-${value.trim()}`);
  return (
    <Field label={label} htmlFor={id} error={!valid}>
      <div className="input-shell">
        {allowNegative && (
          <button type="button" className="sign-button" aria-label={t.toggleSign} onClick={toggleSign}>
            ±
          </button>
        )}
        <input
          id={id}
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          autoComplete="off"
          value={value}
          aria-invalid={!valid}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
    </Field>
  );
}

export function StepperField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  const current = parseCount(value) ?? 0;
  return (
    <Field label={label} htmlFor={id} error={!isCountValid(value)}>
      <div className="input-shell stepper">
        <button type="button" aria-label={`${t.decrease}: ${label}`} onClick={() => onChange(String(Math.max(0, current - 1)))}>
          <Icon name="remove" />
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={t.missing}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" aria-label={`${t.increase}: ${label}`} onClick={() => onChange(String(current + 1))}>
          <Icon name="add" />
        </button>
      </div>
    </Field>
  );
}

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

export function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id}>
      <div className="input-shell select">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="expandMore" />
      </div>
    </Field>
  );
}

export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id}>
      <div className="input-shell">
        <input id={id} type="date" value={value} required onChange={(e) => e.target.value && onChange(e.target.value)} />
      </div>
    </Field>
  );
}

export function SwitchField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="switch-field">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented-field">
      <span>{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            className={option.value === value ? 'selected' : ''}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface DialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onDismiss: () => void;
  danger?: boolean;
  confirmDisabled?: boolean;
}

export function Dialog({ title, children, confirmLabel, onConfirm, onDismiss, danger, confirmDisabled }: DialogProps) {
  return (
    <div className="scrim" onClick={onDismiss}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">
          <button type="button" className="text-action" onClick={onDismiss}>
            {t.cancel}
          </button>
          <button
            type="button"
            className={danger ? 'text-action danger' : 'text-action'}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDelete({ title, text, onConfirm, onDismiss }: { title: string; text: string; onConfirm: () => void; onDismiss: () => void }) {
  return (
    <Dialog title={title} confirmLabel={t.delete} danger onConfirm={onConfirm} onDismiss={onDismiss}>
      <p>{text}</p>
    </Dialog>
  );
}

export function useToast(): [ReactNode, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage((current) => (current === text ? null : current)), 4000);
  }, []);
  const node = message ? (
    <div className="toast" role="status">
      {message}
    </div>
  ) : null;
  return [node, show];
}

