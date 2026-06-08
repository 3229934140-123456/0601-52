import { cn } from '@/lib/utils';
import { type ReactNode, type HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hover?: boolean;
};

type CardComponent = React.FC<CardProps> & {
  Header: React.FC<HTMLAttributes<HTMLDivElement> & { children: ReactNode }>;
  Body: React.FC<HTMLAttributes<HTMLDivElement> & { children: ReactNode }>;
  Footer: React.FC<HTMLAttributes<HTMLDivElement> & { children: ReactNode }>;
};

export const Card = function Card({
  children,
  className,
  hover = false,
  onClick,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl',
        hover && 'card-hover cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
} as CardComponent;

Card.Header = function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('px-6 py-4 border-b border-dark-700', className)} {...props}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className, ...props }) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className, ...props }) {
  return (
    <div className={cn('px-6 py-4 border-t border-dark-700', className)} {...props}>
      {children}
    </div>
  );
};
