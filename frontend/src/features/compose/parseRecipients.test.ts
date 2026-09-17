import { describe, expect, it } from 'vitest';
import { isValidEmail, parseRecipients } from './parseRecipients.ts';

describe('parseRecipients', () => {
  it('reads a CSV with a header row and names', () => {
    const csv =
      'name,email\nSarah Wilson,sarah.wilson@example.com\n"Olive, Jr",olive@example.com\n';
    expect(parseRecipients(csv)).toEqual([
      { email: 'sarah.wilson@example.com', name: 'Sarah Wilson' },
      { email: 'olive@example.com', name: 'Olive Jr' },
    ]);
  });

  it('reads plain lists and angle-bracket forms', () => {
    const text =
      'john@example.com\nJohn Smith <JOHN@example.com>\ndave@example.com; support@example.com';
    expect(parseRecipients(text)).toEqual([
      { email: 'john@example.com', name: null },
      { email: 'dave@example.com', name: null },
      { email: 'support@example.com', name: null },
    ]);
  });

  it('ignores lines without an address', () => {
    expect(parseRecipients('hello\nno address here\n')).toEqual([]);
  });
});

describe('isValidEmail', () => {
  it('accepts normal addresses and rejects fragments', () => {
    expect(isValidEmail('a.b+c@example.co.uk')).toBe(true);
    expect(isValidEmail('not an email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });
});
