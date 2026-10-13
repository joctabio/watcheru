'use client';

import { Button } from './ui/button';
import { Spinner } from './ui/spinner';

export default function RequestError({ error, onRetry, isRetrying = false }: { error: Error; onRetry: () => void; isRetrying?: boolean }) {
  return (
    <div role='alert' className='cinema-error'>
      <span>{error.message}</span>
      <Button type='button' variant='outline' onClick={onRetry} disabled={isRetrying} aria-busy={isRetrying}>{isRetrying && <Spinner size={16} aria-hidden />}{isRetrying ? 'Retrying…' : 'Retry'}</Button>
    </div>
  );
}
