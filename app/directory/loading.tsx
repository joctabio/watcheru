import { Spinner } from '@/components/ui/spinner';

export default function Loading() {
  return <div className='projecting' role='status'><Spinner size={28} aria-hidden /><span className='eyebrow'>Loading movies…</span></div>;
}
