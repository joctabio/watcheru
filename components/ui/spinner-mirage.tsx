import { Spinner } from './spinner';

type SpinnerMirageProps = { size?: string; speed?: string; color?: string };

export default function SpinnerMirage({ size = '24', speed = '1.1', color = 'currentColor' }: SpinnerMirageProps) {
  return <Spinner size={Number(size)} style={{ animationDuration: `${speed}s`, color }} />;
}
