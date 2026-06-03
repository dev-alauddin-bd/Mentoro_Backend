import { Response } from 'express';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/cookie';

describe('Cookie utilities', () => {
  const createMockResponse = () => {
    const res = {} as Partial<Response>;
    res.cookie = jest.fn().mockReturnThis();
    res.clearCookie = jest.fn().mockReturnThis();
    return res as Response;
  };

  afterEach(() => {
    jest.resetModules();
    delete process.env.NODE_ENV;
  });

  it('sets refresh token cookie with correct options in non-production', () => {
    const mockRes = createMockResponse();
    const token = 'test-token';
    setRefreshTokenCookie(mockRes, token);
    expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', token, expect.objectContaining({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }));
  });

  it('sets refresh token cookie with production options when NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    const { setRefreshTokenCookie: prodSetRefreshTokenCookie } = require('../utils/cookie');
    const mockRes = createMockResponse();
    const token = 'prod-token';
    prodSetRefreshTokenCookie(mockRes, token);
    expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', token, expect.objectContaining({
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }));
  });

  it('clears refresh token cookie and sets expired cookie', () => {
    const mockRes = createMockResponse();
    clearRefreshTokenCookie(mockRes);
    expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    }));
    expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', '', expect.objectContaining({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      expires: expect.any(Date),
    }));
    const expiresArg = (mockRes.cookie as jest.Mock).mock.calls[0][2].expires as Date;
    expect(expiresArg.getTime()).toBe(0);
  });
});
