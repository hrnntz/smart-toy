import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';

describe('Auth Middleware Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret-key-12345' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('authenticateToken', () => {
    it('should return 401 when Authorization header is missing', () => {
      const req = { headers: {} } as unknown as AuthRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token de autenticación requerido',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when header does not start with Bearer ', () => {
      const req = {
        headers: { authorization: 'Basic 12345' },
      } as unknown as AuthRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 when JWT_SECRET is missing from environment', () => {
      delete process.env.JWT_SECRET;

      const req = {
        headers: { authorization: 'Bearer dummytoken' },
      } as unknown as AuthRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'JWT_SECRET no está configurado',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid or expired', () => {
      const req = {
        headers: { authorization: 'Bearer invalid.token.payload' },
      } as unknown as AuthRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token inválido o expirado',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should attach decoded user to req and call next() on valid token', () => {
      const payload = { userId: 42, email: 'parent@smarttoy.com' };
      const validToken = jwt.sign(payload, 'test-secret-key-12345', { algorithm: 'HS256' });

      const req = {
        headers: { authorization: `Bearer ${validToken}` },
      } as unknown as AuthRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as NextFunction;

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        userId: 42,
        email: 'parent@smarttoy.com',
      });
    });
  });

  describe('optionalAuth', () => {
    it('should continue with next() when no authorization header is provided', () => {
      const req = { headers: {} } as unknown as AuthRequest;
      const res = {} as Response;
      const next = jest.fn() as NextFunction;

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should attach user if valid token is provided', () => {
      const payload = { userId: 99, email: 'optional@smarttoy.com' };
      const validToken = jwt.sign(payload, 'test-secret-key-12345', { algorithm: 'HS256' });

      const req = {
        headers: { authorization: `Bearer ${validToken}` },
      } as unknown as AuthRequest;
      const res = {} as Response;
      const next = jest.fn() as NextFunction;

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        userId: 99,
        email: 'optional@smarttoy.com',
      });
    });

    it('should continue silently even if token is corrupted', () => {
      const req = {
        headers: { authorization: 'Bearer bad.token.here' },
      } as unknown as AuthRequest;
      const res = {} as Response;
      const next = jest.fn() as NextFunction;

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
});
