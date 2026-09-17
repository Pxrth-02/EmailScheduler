import { describe, expect, it } from 'vitest';
import { htmlToText } from '../mail/mailer.js';
import { dedupeRecipients } from './recipients.js';

describe('dedupeRecipients', () => {
  it('collapses case and whitespace variants of the same address', () => {
    const out = dedupeRecipients([
      { email: 'Sarah@Example.com', name: 'Sarah' },
      { email: ' sarah@example.com ', name: 'S. Wilson' },
      { email: 'john@example.com', name: null },
    ]);
    expect(out).toEqual([
      { email: 'sarah@example.com', name: 'Sarah' },
      { email: 'john@example.com', name: null },
    ]);
  });

  it('drops empty addresses and blank names', () => {
    expect(
      dedupeRecipients([
        { email: '  ', name: 'x' },
        { email: 'a@b.co', name: '  ' },
      ]),
    ).toEqual([{ email: 'a@b.co', name: null }]);
  });
});

describe('htmlToText', () => {
  it('turns block elements into line breaks and strips tags and entities', () => {
    const text = htmlToText(
      '<p>Hi <b>there</b>,</p><p>Tom &amp; Jerry<br>see you</p><ul><li>one</li><li>two</li></ul>',
    );
    expect(text).toBe('Hi there,\nTom & Jerry\nsee you\none\ntwo');
  });
});
