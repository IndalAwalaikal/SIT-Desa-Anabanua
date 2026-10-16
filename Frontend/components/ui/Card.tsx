import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outline' | 'flat';
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hoverable = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-[1.125rem] transition-[transform,box-shadow,border-color,background-color] duration-500 ease-out overflow-hidden will-change-transform';

    const variants = {
      default:
        'bg-white/95 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 shadow-[0_10px_30px_rgba(15,44,88,0.05)] dark:shadow-none',
      glass:
        'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-neutral-800/60 shadow-lg shadow-neutral-950/5',
      outline:
        'bg-transparent border border-neutral-200 dark:border-neutral-800',
      flat: 'bg-neutral-50 dark:bg-neutral-900/50 border-none',
    };

    const hoverStyles = hoverable
      ? 'hover:scale-[1.02] hover:shadow-[0_18px_40px_rgba(9,53,119,0.13)] hover:border-primary-400/70 dark:hover:border-primary-600/70'
      : '';

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pb-4', className)} {...props}>
    {children}
  </div>
);

export const CardBody = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-6 py-2', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/50', className)} {...props}>
    {children}
  </div>
);
