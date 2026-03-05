import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges tailwind classes', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('handles conditional classes', () => {
    expect(cn('px-4', true && 'py-2', false && 'm-4')).toBe('px-4 py-2');
  });

  it('handles arrays and objects', () => {
    expect(
      cn('text-sm', ['font-bold', 'italic'], {
        'text-red-500': true,
        'text-blue-500': false,
      })
    ).toBe('text-sm font-bold italic text-red-500');
  });
});
