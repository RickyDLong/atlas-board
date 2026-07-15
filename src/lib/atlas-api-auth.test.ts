import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateApiKey, errorResponse, getAdminClient, getBoardId } from './atlas-api-auth';

describe('atlas-api-auth', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });
  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('validateApiKey', () => {
    const req = (auth?: string) =>
      new Request('https://atlas.test/api', auth ? { headers: { authorization: auth } } : undefined);

    it('returns false when the Authorization header is missing', () => {
      process.env.ATLAS_INTERNAL_API_KEY = 'secret';
      expect(validateApiKey(req())).toBe(false);
    });

    it('returns false when the scheme is not Bearer', () => {
      process.env.ATLAS_INTERNAL_API_KEY = 'secret';
      expect(validateApiKey(req('Basic secret'))).toBe(false);
    });

    it('returns false when the token does not match the server key', () => {
      process.env.ATLAS_INTERNAL_API_KEY = 'secret';
      expect(validateApiKey(req('Bearer wrong'))).toBe(false);
    });

    it('returns false when no server key is configured', () => {
      delete process.env.ATLAS_INTERNAL_API_KEY;
      expect(validateApiKey(req('Bearer secret'))).toBe(false);
    });

    it('returns true for a correct Bearer token', () => {
      process.env.ATLAS_INTERNAL_API_KEY = 'secret';
      expect(validateApiKey(req('Bearer secret'))).toBe(true);
    });
  });

  describe('errorResponse', () => {
    it('builds a JSON response with the given status and message', async () => {
      const res = errorResponse('Nope', 403);
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: 'Nope' });
    });
  });

  describe('getAdminClient', () => {
    it('throws when the Supabase env vars are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(() => getAdminClient()).toThrow(/Missing/);
    });
  });

  describe('getBoardId', () => {
    it('returns the pinned ATLAS_BOARD_ID without touching the database', async () => {
      process.env.ATLAS_BOARD_ID = 'board-pinned';
      await expect(getBoardId()).resolves.toBe('board-pinned');
    });
  });
});
