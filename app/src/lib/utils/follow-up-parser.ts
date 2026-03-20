/**
 * Parses [FOLLOW_UP]...[/FOLLOW_UP] tags from AI responses.
 * Returns clean content + extracted follow-up suggestions.
 */
export function parseFollowUps(content: string): { cleanContent: string; followUps: string[] } {
  const followUpRegex = /\[FOLLOW_UP\]([\s\S]*?)\[\/FOLLOW_UP\]/g;
  const followUps: string[] = [];
  let match;
  while ((match = followUpRegex.exec(content))) {
    const text = match[1].trim();
    if (text) followUps.push(text);
  }
  const cleanContent = content.replace(followUpRegex, '').trim();
  return { cleanContent, followUps };
}
