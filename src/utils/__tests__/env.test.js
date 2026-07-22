const { resolveMediaUrl, getWebOrigin, getRegistrationLink } = require('../env');

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

describe('getWebOrigin', () => {
  const originalEnv = process.env.WEB_ORIGIN;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.WEB_ORIGIN;
    } else {
      process.env.WEB_ORIGIN = originalEnv;
    }
  });

  it('returns the WEB_ORIGIN env var when set, without a trailing slash', () => {
    process.env.WEB_ORIGIN = 'https://custom.example.com/';
    expect(getWebOrigin('https://irrelevant/api/')).toBe('https://custom.example.com');
  });

  it('returns localhost:5173 for a local dev API base', () => {
    delete process.env.WEB_ORIGIN;
    expect(getWebOrigin('http://0.0.0.0:8000/api/')).toBe('http://localhost:5173');
    expect(getWebOrigin('http://192.168.0.203:8000/api/')).toBe('http://localhost:5173');
  });

  it('returns the staging web origin for the staging API base', () => {
    delete process.env.WEB_ORIGIN;
    expect(getWebOrigin('https://timelyonestaging.pythonanywhere.com/api/')).toBe(
      'https://timelyone-staging.vercel.app'
    );
  });

  it('returns the production web origin for the production API base', () => {
    delete process.env.WEB_ORIGIN;
    expect(getWebOrigin('https://salonix-backend-production.up.railway.app/api/')).toBe(
      'https://timelyone.today'
    );
  });
});

describe('getRegistrationLink', () => {
  afterEach(() => {
    delete process.env.WEB_ORIGIN;
  });

  it('builds the join link from the web origin and tenant slug', () => {
    expect(
      getRegistrationLink('acme', 'https://salonix-backend-production.up.railway.app/api/')
    ).toBe('https://timelyone.today/join/acme');
  });

  it('respects the WEB_ORIGIN env var override', () => {
    process.env.WEB_ORIGIN = 'https://custom.example.com';
    expect(getRegistrationLink('acme', 'https://irrelevant/api/')).toBe(
      'https://custom.example.com/join/acme'
    );
  });
});
