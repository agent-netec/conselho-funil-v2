import { SpyAgent } from '../spy-agent';
import { CompetitorProfile } from '@/types/competitors';

describe('SpyAgent Ethical Guardrails', () => {
  const mockCompetitor: CompetitorProfile = {
    id: 'comp_123',
    brandId: 'brand_456',
    name: 'Test Competitor',
    websiteUrl: 'https://example.com',
    category: ['Direct'],
    status: 'active',
    createdAt: {} as any,
    updatedAt: {} as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('should allow scan when robots.txt is not found (404)', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.endsWith('/robots.txt')) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      return Promise.resolve({ 
        ok: true, 
        text: () => Promise.resolve('<html></html>'),
        headers: new Map()
      });
    });

    const result = await SpyAgent.scan(mockCompetitor);
    expect(result.success).toBe(true);
  });

  it('should block scan when robots.txt disallows all', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.endsWith('/robots.txt')) {
        return Promise.resolve({ 
          ok: true, 
          text: () => Promise.resolve('User-agent: *\nDisallow: /') 
        });
      }
      return Promise.resolve({ ok: true });
    });

    const result = await SpyAgent.scan(mockCompetitor);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Access denied by robots.txt');
  });

  it('should block scan when specifically disallowing NETECMT', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.endsWith('/robots.txt')) {
        return Promise.resolve({ 
          ok: true, 
          text: () => Promise.resolve('User-agent: NETECMT\nDisallow: /') 
        });
      }
      return Promise.resolve({ ok: true });
    });

    const result = await SpyAgent.scan(mockCompetitor);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Access denied by robots.txt');
  });

  it('should allow scan when robots.txt disallows other paths', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.endsWith('/robots.txt')) {
        return Promise.resolve({ 
          ok: true, 
          text: () => Promise.resolve('User-agent: *\nDisallow: /admin\nDisallow: /private') 
        });
      }
      return Promise.resolve({ 
        ok: true, 
        text: () => Promise.resolve('<html></html>'),
        headers: new Map()
      });
    });

    const result = await SpyAgent.scan(mockCompetitor);
    expect(result.success).toBe(true);
  });
});
