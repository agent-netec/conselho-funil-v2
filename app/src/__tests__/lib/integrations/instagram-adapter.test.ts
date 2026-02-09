/**
 * @jest-environment node
 */

// Mock firebase/firestore (override global)
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db: unknown, ...path: string[]) => path.join('/')),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromDate: jest.fn(),
  },
}));

jest.mock('@/lib/firebase/config', () => ({
  db: 'mock-db',
}));

jest.mock('@/lib/utils/encryption', () => ({
  decrypt: jest.fn((val: string) => `decrypted_${val}`),
  encrypt: jest.fn((val: string) => `encrypted_${val}`),
}));

import { getDoc } from 'firebase/firestore';
import { collectInstagramInteractions } from '@/lib/integrations/social/instagram-adapter';

const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

// Mock global fetch
const originalFetch = global.fetch;
const mockFetch = jest.fn();

describe('Instagram Adapter — S32-IG-01', () => {
  beforeAll(() => {
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it('retorna [] quando nao ha credentials no vault (degradacao graciosa DT-03)', async () => {
    // Simula doc nao existe
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    } as any);

    const result = await collectInstagramInteractions('brand-no-creds');

    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('retorna [] quando getDoc lanca erro (degradacao graciosa)', async () => {
    mockGetDoc.mockRejectedValueOnce(new Error('Firestore unavailable'));

    const result = await collectInstagramInteractions('brand-error');

    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('chama fetch com URL correta e mapeia resultado para SocialInteraction[]', async () => {
    // Mock credentials
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        accessToken: 'enc_token_123',
        pageId: 'page_456',
        tokenExpiresAt: Date.now() + 86400000 * 7, // 7 days out, well past 24h buffer
      }),
    } as any);

    // Mock conversations response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: 'convo-1', participants: [], updated_time: '2026-02-08T10:00:00Z' },
        ],
      }),
    });

    // Mock messages response for convo-1
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'msg-1',
            message: 'Hello brand!',
            from: { id: 'user-1', name: 'John Doe', username: 'johndoe' },
            created_time: '2026-02-08T10:01:00Z',
          },
        ],
      }),
    });

    const result = await collectInstagramInteractions('brand-ok');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'ig_msg-1',
      externalId: 'msg-1',
      platform: 'instagram',
      type: 'dm',
      status: 'pending',
      author: {
        id: 'user-1',
        name: 'John Doe',
        handle: 'johndoe',
      },
      content: {
        text: 'Hello brand!',
      },
      threadId: 'convo-1',
    });

    // Verify fetch URLs
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const conversationsUrl = mockFetch.mock.calls[0][0] as string;
    expect(conversationsUrl).toContain('graph.instagram.com/v21.0');
    expect(conversationsUrl).toContain('page_456/conversations');
    expect(conversationsUrl).toContain('platform=instagram');

    const messagesUrl = mockFetch.mock.calls[1][0] as string;
    expect(messagesUrl).toContain('convo-1/messages');
  });

  it('retorna [] quando API retorna resposta nao-ok', async () => {
    // Mock credentials
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        accessToken: 'enc_token',
        pageId: 'page_123',
        tokenExpiresAt: Date.now() + 86400000 * 7,
      }),
    } as any);

    // Mock API error (not ok, no 401)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await collectInstagramInteractions('brand-api-fail');

    expect(result).toEqual([]);
  });
});
