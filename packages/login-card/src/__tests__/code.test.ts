import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import {
  NotALoginCodeError,
  cardSvg,
  groupCode,
  isLoginCode,
  loginCodeMatrix,
  loginCodeSvg,
  wrap,
} from '../code';
import { fakeCode, toImage } from './helpers';

describe('isLoginCode', () => {
  it('accepts SystemAuth codes only', () => {
    expect(isLoginCode(fakeCode())).toBe(true);
    for (const v of [
      '',
      'SFLT',
      fakeCode().toLowerCase(),
      `${fakeCode()}A`,
      'https://example.com/SFLT',
      `SFLT${'1'.repeat(52)}`,
    ]) {
      expect(isLoginCode(v)).toBe(false);
    }
  });
});

describe('the QR code', () => {
  it('decodes back to exactly the code', () => {
    for (let i = 0; i < 5; i++) {
      const code = fakeCode();
      const img = toImage(loginCodeMatrix(code));
      expect(jsQR(img.data, img.width, img.height)?.data).toBe(code);
    }
  });

  it('refuses anything that is not a login code, without echoing it', () => {
    expect(() => loginCodeMatrix('https://evil.example/x')).toThrow(NotALoginCodeError);
    expect(() => loginCodeSvg('https://evil.example/x')).toThrow(/not a login code$/);
  });

  it('takes the application predicate', () => {
    const img = toImage(loginCodeMatrix('ABC123', { isLoginCode: (v) => v === 'ABC123' }));
    expect(jsQR(img.data, img.width, img.height)?.data).toBe('ABC123');
  });

  it('draws an SVG that never holds the code as text', () => {
    const code = fakeCode();
    const svg = loginCodeSvg(code, { size: '40mm', title: 'Robin <card>' });
    expect(svg).toContain('width="40mm"');
    expect(svg).toContain('Robin &lt;card&gt;');
    expect(svg).not.toContain(code);
    expect(svg).not.toContain(code.slice(4, 12));
  });
});

describe('the card', () => {
  it('prints the name, expiry, instructions and grouped code, escaped', () => {
    const code = fakeCode();
    const svg = cardSvg(
      {
        code,
        name: 'Robin <b>&"',
        instructions: 'Go to adept.quest, choose I am a student, then Scan my card',
        expiresAt: new Date(2027, 5, 30),
        picture: 'data:image/png;base64,AAA"',
      },
      { formatDate: () => 'June 30, 2027' }
    );
    expect(svg).toContain('width="85.6mm" height="54mm"');
    expect(svg).toContain('Robin &lt;b&gt;&amp;&quot;');
    expect(svg).not.toContain('<b>');
    expect(svg).toContain('Works until June 30, 2027');
    expect(svg).toContain('my card');
    expect(svg).toContain('AAA&quot;');
    for (const group of groupCode(code).split(' ')) expect(svg).toContain(group);
    expect(svg).not.toContain(code);
  });

  it('leaves out what it is not given', () => {
    const svg = cardSvg({ code: fakeCode(), name: 'Sam' });
    expect(svg).not.toContain('Works until');
    expect(svg).not.toContain('<image');
  });
});

describe('helpers', () => {
  it('groups by four', () => {
    expect(groupCode('SFLTABCDEFGHIJ')).toBe('SFLT ABCD EFGH IJ');
  });
  it('wraps at spaces', () => {
    expect(wrap('one two three four', 9)).toEqual(['one two', 'three', 'four']);
  });
});
