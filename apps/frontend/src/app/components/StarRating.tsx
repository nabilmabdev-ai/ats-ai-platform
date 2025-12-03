'use client';

import { useState } from 'react';

interface StarRatingProps {
  label: string;
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
}

export default function StarRating({ label, value, onChange, readOnly }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  return (
    <div className="flex justify-between items-center py-3 border-b border-[var(--color-border-subtle)] last:border-0">
      <span className="text-sm font-bold text-[var(--color-text-dark)] uppercase tracking-wide">{label}</span>
      <div className="flex gap-1" onMouseLeave={() => !readOnly && setHoverValue(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = (hoverValue !== null ? star <= hoverValue : star <= value);
          const isHovered = hoverValue === star;

          return (
            <button
              key={star}
              onClick={() => !readOnly && onChange?.(star)}
              onMouseEnter={() => !readOnly && setHoverValue(star)}
              type="button"
              disabled={readOnly}
              className={`
                focus:outline-none transition-all duration-200 transform
                ${!readOnly ? 'cursor-pointer active:scale-95 hover:scale-110' : 'cursor-default'}
                ${isFilled ? 'text-[var(--color-warning)]' : 'text-[var(--color-border)]'}
                ${isHovered ? 'opacity-100' : isFilled && hoverValue ? 'opacity-60' : 'opacity-100'}
              `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 drop-shadow-sm"
              >
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}