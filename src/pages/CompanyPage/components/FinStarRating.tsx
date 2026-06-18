import React from 'react';
import { Star } from 'lucide-react';

interface FinStarRatingProps {
  stars: number;
  maxStars?: number;
  className?: string;
  starClassName?: string;
}

export const FinStarRating: React.FC<FinStarRatingProps> = ({
  stars,
  maxStars = 5,
  className = 'flex items-center gap-0.5',
  starClassName = 'h-4.5 w-4.5',
}) => {
  return (
    <div className={className}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star
          key={i}
          className={`${starClassName} ${
            i < stars
              ? 'text-[#F59E0B] fill-[#F59E0B]'
              : 'text-[#E5E8EF] stroke-[#E5E8EF] fill-none'
          }`}
        />
      ))}
    </div>
  );
};
