import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className = '', onClick, hover = true, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={`bg-white rounded-xl border border-gray-200 p-6 ${
        hover ? 'hover:shadow-lg transition-shadow duration-200' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
