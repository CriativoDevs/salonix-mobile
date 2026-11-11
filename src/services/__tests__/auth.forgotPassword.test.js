const mockPost = jest.fn();
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: { post: (...args) => mockPost(...args) },
}));

import { forgotPassword } from '../auth';

describe('forgotPassword', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('sends only the email, never a client-controlled reset_url', async () => {
    mockPost.mockResolvedValue({ data: { status: 'ok' } });
    await forgotPassword('user@example.com');
    expect(mockPost).toHaveBeenCalledWith('users/password/reset/', {
      email: 'user@example.com',
    });
  });
});
