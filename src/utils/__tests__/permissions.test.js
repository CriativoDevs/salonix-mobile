import { isOwner } from '../permissions';

describe('isOwner', () => {
  it('returns true when role is owner', () => {
    expect(isOwner({ role: 'owner' })).toBe(true);
  });

  it('returns false when role is manager', () => {
    expect(isOwner({ role: 'manager' })).toBe(false);
  });

  it('returns false when role is collaborator', () => {
    expect(isOwner({ role: 'collaborator' })).toBe(false);
  });

  it('returns false for is_superuser without role owner (no bypass)', () => {
    expect(isOwner({ is_superuser: true, role: 'manager' })).toBe(false);
    expect(isOwner({ is_superuser: true })).toBe(false);
  });

  it('returns false for null or undefined userInfo', () => {
    expect(isOwner(null)).toBe(false);
    expect(isOwner(undefined)).toBe(false);
  });
});
