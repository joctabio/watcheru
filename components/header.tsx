'use client';

import { redirect, useSearchParams } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { Field, FieldGroup } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@/components/ui/input-group';
import { IconSearch } from '@tabler/icons-react';

const formSchema = z.object({
  searchText: z.string().min(1)
});

export default function Header() {
  const searchParams = useSearchParams();
  const searchText = searchParams.get('search');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      searchText: searchText || ''
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    redirect(`/directory?search=${values.searchText}`);
  };

  return (
    <div className='fixed top-0 w-full z-50 flex items-center justify-between gap-4'>
      <div className='flex px-6 py-4 w-full gap-5'>
        <div className='flex w-full items-center gap-5'>
          <a href={'/'} title={'Watcheru homepage'}>
            <span className='font-bold'>Watcheru</span>
          </a>
          <div className='flex gap-3 w-full'>
            <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
              <FieldGroup>
                <Controller
                  name='searchText'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <div className='flex gap-2 justify-end'>
                        <InputGroup className='flex-1 max-w-2xs'>
                          <InputGroupAddon>
                            <IconSearch />
                          </InputGroupAddon>
                          <InputGroupInput
                            {...field}
                            aria-invalid={fieldState.invalid}
                            autoComplete='off'
                            placeholder='Search movies...'
                          />
                        </InputGroup>
                      </div>
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}
