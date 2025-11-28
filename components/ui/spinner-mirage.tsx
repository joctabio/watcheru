import { Mirage } from 'ldrs/react';
import 'ldrs/react/Mirage.css';

type SpinnerMirageProps = {
  size?: string;
  speed?: string;
  color?: string;
};

export default function SpinnerMirage({
  size = '60',
  speed = '2.5',
  color = 'white'
}: SpinnerMirageProps) {
  return <Mirage size={size} speed={speed} color={color} />;
}
