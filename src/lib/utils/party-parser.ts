import { COUNSELORS_REGISTRY } from '../constants';
import type { CounselorId } from '@/types';

export type PartySection = {
  type: 'header' | 'agent' | 'verdict' | 'text';
  agentId?: CounselorId;
  agentName?: string;
  content: string;
  mentions?: CounselorId[];
};

/**
 * Detects mentions of counselors in a text.
 */
function detectMentions(content: string, currentAgentId?: CounselorId): CounselorId[] {
  const mentions = new Set<CounselorId>();
  const counselors = Object.values(COUNSELORS_REGISTRY);

  for (const counselor of counselors) {
    if (counselor.id === currentAgentId) continue;

    // Procura pelo nome completo ou sobrenome
    const nameParts = counselor.name.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    
    // Regex para encontrar o nome como palavra inteira, case insensitive
    const nameRegex = new RegExp(`\\b(${counselor.name}|${lastName})\\b`, 'gi');
    
    if (nameRegex.test(content)) {
      mentions.add(counselor.id);
    }
  }

  return Array.from(mentions);
}

/**
 * Parses a multi-persona response into structured sections.
 * 
 * Expected format:
 * ### 🎙️ Deliberação do Conselho
 * 
 * **[AGENT NAME]**: Content...
 * 
 * ---
 * ### ⚖️ Veredito do Moderador
 * Final content...
 */
export function parsePartyResponse(content: string): PartySection[] {
  const sections: PartySection[] = [];
  
  // Split by agent headers or verdict header
  // Using a negative lookahead to not consume the delimiter if we want to keep it, 
  // but here we want to identify the parts.
  
  const lines = content.split('\n');
  let currentSection: PartySection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for Main Header
    if (line.includes('### 🎙️ Deliberação do Conselho')) {
      if (currentSection) sections.push(currentSection);
      sections.push({
        type: 'header',
        content: line.trim()
      });
      currentSection = null;
      continue;
    }

    // Check for Verdict Header
    if (line.includes('### ⚖️ Veredito do Moderador') || line.includes('### ⚖️ Veredito')) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        type: 'verdict',
        content: ''
      };
      continue;
    }

    // Check for Agent Header: **[NAME]**:
    const agentMatch = line.match(/\*\*\[(.*?)\]\*\*:\s*(.*)/);
    if (agentMatch) {
      if (currentSection) sections.push(currentSection);
      
      const agentNameRaw = agentMatch[1];
      const agentContent = agentMatch[2];
      
      // Find agentId by name (case insensitive)
      const agentId = Object.keys(COUNSELORS_REGISTRY).find(id => 
        COUNSELORS_REGISTRY[id as CounselorId].name.toUpperCase() === agentNameRaw.toUpperCase()
      ) as CounselorId | undefined;

      currentSection = {
        type: 'agent',
        agentId,
        agentName: agentNameRaw,
        content: agentContent + '\n'
      };
      continue;
    }

    // Check for separator
    if (line.trim() === '---') {
      // Separators usually precede the verdict, we can ignore them or use them to close current section
      if (currentSection) sections.push(currentSection);
      currentSection = null;
      continue;
    }

    // Append to current section or start a new text section
    if (currentSection) {
      currentSection.content += line + '\n';
    } else if (line.trim() !== '') {
      currentSection = {
        type: 'text',
        content: line + '\n'
      };
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  // Trim contents and detect mentions
  const parsedSections = sections.map(s => {
    const trimmedContent = s.content.trim();
    return {
      ...s,
      content: trimmedContent,
      mentions: s.type === 'agent' ? detectMentions(trimmedContent, s.agentId) : undefined
    };
  }).filter(s => s.content !== '' || s.type === 'header');

  return parsedSections;
}

/**
 * Extracts a summary of interactions between agents.
 */
export function getInteractionSummary(sections: PartySection[]) {
  const interactions: Array<{ from: CounselorId; to: CounselorId[] }> = [];
  
  sections.forEach(s => {
    if (s.type === 'agent' && s.agentId && s.mentions && s.mentions.length > 0) {
      interactions.push({
        from: s.agentId,
        to: s.mentions
      });
    }
  });

  return interactions;
}
