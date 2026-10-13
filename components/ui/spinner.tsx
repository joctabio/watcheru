import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type SpinnerProps = ComponentProps<'svg'> & { size?: number; label?: string };

export function Spinner({ className, size = 20, label = 'Loading', ...props }: SpinnerProps) {
  const decorative = props['aria-hidden'] === true || props['aria-hidden'] === 'true';
  return (
    <svg viewBox='0 0 24 24' width={size} height={size} fill='none' className={cn('cinema-spinner', className)} role={decorative ? undefined : 'status'} aria-label={decorative ? undefined : label} {...props}>
      <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2' opacity='.16' />
      <circle className='spinner-arc' cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeDasharray='18 57' />
    </svg>
  );
}
