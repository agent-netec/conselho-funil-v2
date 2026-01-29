import { TechStackDiscovery } from '../tech-discovery';

describe('TechStackDiscovery', () => {
  it('should detect WordPress from HTML', () => {
    const html = '<html><head><link rel="stylesheet" href="/wp-content/themes/twentytwentyone/style.css"></head><body></body></html>';
    const headers = {};
    const result = TechStackDiscovery.discover(html, headers);
    expect(result.cms).toBe('WordPress');
  });

  it('should detect Webflow from DOM attributes', () => {
    const html = '<html data-wf-page="123" data-wf-site="456"><body></body></html>';
    const headers = {};
    const result = TechStackDiscovery.discover(html, headers);
    expect(result.cms).toBe('Webflow');
  });

  it('should detect GTM and Meta Pixel from scripts', () => {
    const html = `
      <html>
        <head>
          <script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXX"></script>
          <script>fbq('init', '123456');</script>
        </head>
      </html>
    `;
    const headers = {};
    const result = TechStackDiscovery.discover(html, headers);
    expect(result.analytics).toContain('GTM');
    expect(result.analytics).toContain('Meta Pixel');
  });

  it('should detect Cloudflare from headers', () => {
    const html = '<html></html>';
    const headers = {
      'server': 'cloudflare',
      'cf-ray': '1234567890',
    };
    const result = TechStackDiscovery.discover(html, headers);
    expect(result.infrastructure).toContain('Cloudflare');
  });

  it('should detect Stripe and Hotmart from scripts', () => {
    const html = `
      <html>
        <body>
          <script src="https://js.stripe.com/v3/"></script>
          <a href="https://pay.hotmart.com/B12345678X">Comprar</a>
        </body>
      </html>
    `;
    const headers = {};
    const result = TechStackDiscovery.discover(html, headers);
    expect(result.payments).toContain('Stripe');
    expect(result.payments).toContain('Hotmart');
  });

  it('should detect Kiwify and TikTok Pixel', () => {
    const html = `
      <html>
        <head>
          <script src="https://pay.kiwify.com.br/js/kiwify.js"></script>
          <script>ttq.load('ABC123');</script>
        </head>
      </html>
    `;
    const headers = {};
    const result = TechStackDiscovery.discover(html, headers);
    expect(result.payments).toContain('Kiwify');
    expect(result.analytics).toContain('TikTok Pixel');
  });
});
