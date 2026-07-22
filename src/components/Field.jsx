import { useId } from 'react';

// Labeled input with inline error text (shown on blur when required & empty).
export function Field({ label, error, hint, children, id: providedId, required }) {
  const generatedId = useId();
  const id = providedId || generatedId;
  return (
    <div>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {typeof children === 'function' ? children(id) : children}
      {hint && !error && <p className="mt-1 text-caption text-muted">{hint}</p>}
      {error && <p className="mt-1 text-caption text-danger">{error}</p>}
    </div>
  );
}

export function TextInput({ error, ...props }) {
  return <input className={`input ${error ? 'border-danger' : ''}`} {...props} />;
}

export function TextArea({ error, ...props }) {
  return <textarea className={`input min-h-[96px] resize-y ${error ? 'border-danger' : ''}`} {...props} />;
}

export function Select({ error, children, ...props }) {
  return (
    <select className={`input appearance-none ${error ? 'border-danger' : ''}`} {...props}>
      {children}
    </select>
  );
}
