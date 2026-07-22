import { Spinner } from './Spinner';

// Variants: primary | secondary | ghost. Loading swaps the label for a spinner
// while keeping the button size stable (no layout shift).
export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  children,
  className = '',
  type = 'button',
  ...rest
}) {
  const cls = { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost' }[variant];
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${cls} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size={20} light={variant === 'primary'} /> : children}
    </button>
  );
}
