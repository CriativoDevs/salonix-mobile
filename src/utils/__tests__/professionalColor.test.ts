import { getProfessionalColor } from '../professionalColor';

describe('getProfessionalColor', () => {
  it('returns the same color for the same id', () => {
    expect(getProfessionalColor(5)).toEqual(getProfessionalColor(5));
  });

  it('returns different colors for different ids within the palette size', () => {
    expect(getProfessionalColor(0)).not.toEqual(getProfessionalColor(1));
  });

  it('wraps around the palette using modulo (10 colors)', () => {
    expect(getProfessionalColor(0)).toEqual(getProfessionalColor(10));
  });

  it('handles string ids', () => {
    expect(getProfessionalColor('3')).toEqual(getProfessionalColor(3));
  });

  it('falls back to index 0 for null/invalid ids', () => {
    expect(getProfessionalColor(null)).toEqual(getProfessionalColor(0));
    expect(getProfessionalColor(undefined)).toEqual(getProfessionalColor(0));
  });

  it('returns a solid dot color and a translucent background color', () => {
    const color = getProfessionalColor(1);
    expect(color.dot).toMatch(/^#[0-9a-f]{6}$/i);
    expect(color.background).toMatch(/^#[0-9a-f]{6}[0-9a-f]{2}$/i);
  });
});
