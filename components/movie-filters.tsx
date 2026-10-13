import type { Genre } from '@/app/definitions';
import { RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

export default function MovieFilters({ genres, disabled, id, hidden }: { genres: Genre[]; disabled: boolean; id: string; hidden: boolean }) {
  return (
    <div id={id} hidden={hidden} className='preferences' role='region' aria-label='Filters for the next movie pick'>
      <fieldset disabled={disabled} className='preferences-fields' aria-label='Movie preferences'>
        <label>Genre
          <select name='genre' className='cinema-field' defaultValue=''>
            <option value=''>Any genre</option>
            {genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
          </select>
        </label>
        <label>Original language
          <select name='language' className='cinema-field' defaultValue=''>
            <option value=''>Any language</option>
            <option value='en'>English</option><option value='tl'>Tagalog</option><option value='ko'>Korean</option><option value='ja'>Japanese</option><option value='es'>Spanish</option><option value='fr'>French</option><option value='hi'>Hindi</option><option value='zh'>Chinese</option>
          </select>
        </label>
        <label>Release year
          <input className='cinema-field' name='year' type='number' min={1874} max={2100} step={1} placeholder='Any year' />
        </label>
        <label>Maximum runtime (minutes)
          <input className='cinema-field' name='maxRuntime' type='number' min={1} max={600} step={1} placeholder='Any length' />
        </label>
        <label>Minimum rating (out of 10)
          <input className='cinema-field' name='minRating' type='number' min={0} max={10} step={0.5} placeholder='Any rating' />
        </label>
        <Button type='reset' variant='ghost' className='self-end justify-start'><RotateCcw size={13} />Reset preferences</Button>
      </fieldset>
      <p className='preferences-help'>Preferences apply to the next pick. Rated selections have at least 50 audience votes.</p>
    </div>
  );
}
