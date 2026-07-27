export function Spinner({ size = 24, light = false }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className="inline-block animate-spin rounded-full border-2 border-solid"
      style={{
        width: size,
        height: size,
        borderColor: light ? 'rgba(255,255,255,0.4)' : '#E8DFD1',
        borderTopColor: light ? '#FFFFFF' : '#C25E38',
      }}
    />
  );
}
