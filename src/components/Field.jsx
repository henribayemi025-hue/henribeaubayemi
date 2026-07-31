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

// `className` est FUSIONNÉ, pas écrasé: avec `{...props}` posé après un
// className calculé, un appelant qui passait className="flex-1" effaçait
// silencieusement `input` (et donc toute la mise en forme du champ). Ajouter
// une classe utilitaire à un champ est un besoin banal — il ne doit pas
// casser le champ.
export function TextInput({ error, className = '', ...props }) {
  return <input className={`input ${error ? 'border-danger' : ''} ${className}`} {...props} />;
}

export function TextArea({ error, className = '', ...props }) {
  return <textarea className={`input min-h-[96px] resize-y ${error ? 'border-danger' : ''} ${className}`} {...props} />;
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select className={`input appearance-none ${error ? 'border-danger' : ''} ${className}`} {...props}>
      {children}
    </select>
  );
}
