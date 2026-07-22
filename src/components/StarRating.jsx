import { IconStarFilled, IconStar } from '@tabler/icons-react';

// Display-only rating, or interactive when onChange is provided.
export function StarRating({ value = 0, size = 16, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="inline-flex items-center gap-0.5">
      {stars.map((s) => {
        const filled = s <= Math.round(value);
        const Star = filled ? IconStarFilled : IconStar;
        if (onChange) {
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              aria-label={`${s} / 5`}
              className="text-brass"
            >
              <Star size={size} />
            </button>
          );
        }
        return <Star key={s} size={size} className="text-brass" aria-hidden="true" />;
      })}
    </span>
  );
}
