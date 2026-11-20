import {
  PROFILE_IMAGE_MIN_PX,
  PROFILE_IMAGE_MAX_PX,
  hasValidProfileImageDimensions,
} from '../imageLimits';

describe('hasValidProfileImageDimensions (limites do BE: 50x50 a 2000x2000)', () => {
  it('limites do BE', () => {
    expect(PROFILE_IMAGE_MIN_PX).toBe(50);
    expect(PROFILE_IMAGE_MAX_PX).toBe(2000);
  });

  it.each([
    [{ width: 800, height: 600 }, true],
    [{ width: 2000, height: 2000 }, true],
    [{ width: 50, height: 50 }, true],
    [{ width: 4032, height: 3024 }, false], // foto típica de telemóvel
    [{ width: 2001, height: 100 }, false],
    [{ width: 100, height: 2001 }, false],
    [{ width: 49, height: 500 }, false],
    [{ width: 500, height: 49 }, false],
  ])('%j -> %s', (asset, expected) => {
    expect(hasValidProfileImageDimensions(asset)).toBe(expected);
  });

  it('aceita quando o picker não informa as dimensões (o BE decide)', () => {
    expect(hasValidProfileImageDimensions({})).toBe(true);
    expect(hasValidProfileImageDimensions({ width: 0, height: 0 })).toBe(true);
    expect(hasValidProfileImageDimensions(null)).toBe(true);
  });
});
