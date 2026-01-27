/**
 * Anonymization Layer for AI Reporting
 * Ensures PII (Personally Identifiable Information) is removed before sending to Gemini
 */

export interface AnonymizedData {
  [key: string]: any;
}

/**
 * Anonymizes data for AI consumption
 * Rules:
 * - Replace names with initials or generic labels
 * - Mask emails (e.g., u***@domain.com)
 * - Mask phone numbers
 * - Round financial values if necessary (optional, based on sensitivity)
 */
export function anonymizeDataForAI(data: any): AnonymizedData {
  if (!data) return data;

  // Deep clone to avoid mutating original data
  const cloned = JSON.parse(JSON.stringify(data));

  const processObject = (obj: any) => {
    for (const key in obj) {
      const value = obj[key];

      // 1. Check for PII in the value itself if it's a string (Deep Scan)
      if (typeof value === 'string') {
        // Mask emails found anywhere in strings
        obj[key] = value.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => maskEmail(match));
        // Mask phone numbers (basic pattern)
        obj[key] = obj[key].replace(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g, '***-***-****');
      }

      // 2. Sensitive keys to mask/remove
      if (['email', 'userEmail', 'customerEmail'].includes(key) && typeof value === 'string') {
        obj[key] = maskEmail(value);
      } else if (['phone', 'phoneNumber', 'cellphone'].includes(key) && typeof value === 'string') {
        obj[key] = '***-***-****';
      } else if (['name', 'userName', 'customerName', 'fullName'].includes(key) && typeof value === 'string') {
        obj[key] = anonymizeName(value);
      } else if (['address', 'street', 'zipcode'].includes(key)) {
        obj[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        processObject(value);
      }
    }
  };

  processObject(cloned);
  return cloned;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***.com';
  return `${local.charAt(0)}***@${domain}`;
}

function anonymizeName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'Client';
  if (parts.length === 1) return `${parts[0].charAt(0)}.`;
  return `${parts[0].charAt(0)}. ${parts[parts.length - 1].charAt(0)}.`;
}
