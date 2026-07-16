const { resolveMediaUrl } = require('../env');

describe('resolveMediaUrl', () => {
  it('returns null for falsy input', () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl(undefined)).toBeNull();
    expect(resolveMediaUrl('')).toBeNull();
  });

  it('returns absolute URLs unchanged', () => {
    expect(resolveMediaUrl('https://cdn.example.com/logo.png')).toBe('https://cdn.example.com/logo.png');
    expect(resolveMediaUrl('http://cdn.example.com/logo.png')).toBe('http://cdn.example.com/logo.png');
  });

  it('prefixes a relative media path (with leading slash) with the API origin, stripping /api/', () => {
    expect(
      resolveMediaUrl('/media/logos/xyz.png', 'https://salonix-backend-production.up.railway.app/api/')
    ).toBe('https://salonix-backend-production.up.railway.app/media/logos/xyz.png');
  });

  it('prefixes a relative media path (without leading slash) the same way', () => {
    expect(
      resolveMediaUrl('media/logos/xyz.png', 'https://salonix-backend-production.up.railway.app/api/')
    ).toBe('https://salonix-backend-production.up.railway.app/media/logos/xyz.png');
  });
});
