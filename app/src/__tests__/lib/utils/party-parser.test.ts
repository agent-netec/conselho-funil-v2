import { parsePartyResponse } from '../../../lib/utils/party-parser';

describe('party-parser', () => {
  it('should parse a complete multi-persona response', () => {
    const content = `
### 🎙️ Deliberação dos Especialistas

**[RUSSELL BRUNSON]**: Sua perspectiva aqui sobre funis.

**[DAN KENNEDY]**: Minha visão sobre o que o Russell disse e sobre a oferta.

---
### ⚖️ Veredito do Moderador
Resumo final e próximos passos práticos.
    `;

    const sections = parsePartyResponse(content);

    expect(sections).toHaveLength(4);
    
    expect(sections[0]).toEqual({
      type: 'header',
      content: '### 🎙️ Deliberação dos Especialistas'
    });

    expect(sections[1]).toEqual({
      type: 'agent',
      agentId: 'russell_brunson',
      agentName: 'RUSSELL BRUNSON',
      content: 'Sua perspectiva aqui sobre funis.',
      mentions: []
    });

    expect(sections[2]).toEqual({
      type: 'agent',
      agentId: 'dan_kennedy',
      agentName: 'DAN KENNEDY',
      content: 'Minha visão sobre o que o Russell disse e sobre a oferta.',
      mentions: []
    });

    expect(sections[3]).toEqual({
      type: 'verdict',
      content: 'Resumo final e próximos passos práticos.'
    });
  });

  it('should handle missing main header', () => {
    const content = `
**[FRANK KERN]**: Psicologia comportamental.
---
### ⚖️ Veredito
Conclusão.
    `;
    const sections = parsePartyResponse(content);
    expect(sections[0].type).toBe('agent');
    expect(sections[1].type).toBe('verdict');
  });

  it('should handle agents not in registry by name', () => {
    const content = `**[UNKNOWN AGENT]**: Content.`;
    const sections = parsePartyResponse(content);
    expect(sections[0].agentId).toBeUndefined();
    expect(sections[0].agentName).toBe('UNKNOWN AGENT');
  });

  it('should ignore empty lines and handle separators', () => {
    const content = `
**[DAN KENNEDY]**: Line 1.

Line 2.

---
### ⚖️ Veredito do Moderador
End.
    `;
    const sections = parsePartyResponse(content);
    expect(sections[0].content).toContain('Line 1.\n\nLine 2.');
  });
});
