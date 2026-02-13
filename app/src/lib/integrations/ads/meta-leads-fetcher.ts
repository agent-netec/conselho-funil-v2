/**
 * @fileoverview Meta Lead Ads Fetcher
 * Pulls historical lead form submissions from Meta Graph API
 * and writes them to Firestore as leads in the Maestro data model.
 *
 * Uses: ensureFreshToken, fetchWithRetry, META_API constants.
 */

import { doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ensureFreshToken } from './token-refresh';
import { fetchWithRetry, sanitizeForLog } from './api-helpers';
import { META_API } from './constants';
import type { MetaTokenMetadata } from '@/lib/firebase/vault';

// ── Types ────────────────────────────────────────────────────────────────────

interface MetaLeadFormField {
  name: string;
  values: string[];
}

interface MetaLead {
  id: string;
  created_time: string;
  field_data: MetaLeadFormField[];
}

interface MetaLeadForm {
  id: string;
  name: string;
  status: string;
  leads_count?: number;
}

interface MetaPaginatedResponse<T> {
  data: T[];
  paging?: { cursors?: { after: string }; next?: string };
}

interface MetaPage {
  id: string;
  name: string;
}

export interface LeadImportResult {
  formsFound: number;
  leadsImported: number;
  errors: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const LEADS_PER_FORM_CAP = 500;
const LEADS_PAGE_SIZE = 100;

// ── Main ─────────────────────────────────────────────────────────────────────

/**
 * Fetches all lead form submissions from Meta and writes them to Firestore.
 * Idempotent: uses Meta lead ID as doc ID + setDoc(merge: true).
 */
export async function fetchMetaLeads(brandId: string): Promise<LeadImportResult> {
  const result: LeadImportResult = { formsFound: 0, leadsImported: 0, errors: [] };

  // 1. Get fresh token + extract adAccountId
  const token = await ensureFreshToken(brandId, 'meta');
  const metadata = token.metadata as MetaTokenMetadata;
  const adAccountId = metadata.adAccountId?.replace('act_', '') || '';

  if (!adAccountId) {
    throw new Error('Ad Account ID não encontrado. Configure a integração Meta em /integrations.');
  }

  const headers = { Authorization: `Bearer ${token.accessToken}` };

  // 2. Get pages associated with the ad account
  //    leadgen_forms is a PAGE-level edge, not AdAccount-level.
  //    We must first discover the pages, then query forms per page.
  const pagesUrl = `${META_API.BASE_URL}/act_${adAccountId}/promote_pages?fields=id,name&limit=100`;
  console.log(`[MetaLeadsFetcher] Listing pages for act_${adAccountId}`);

  const pagesResponse = await fetchWithRetry(pagesUrl, { headers }, { timeoutMs: META_API.TIMEOUT_MS });

  if (!pagesResponse.ok) {
    const errorData = await pagesResponse.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || pagesResponse.statusText;
    const code = errorData?.error?.code;

    if (pagesResponse.status === 403 || code === 200 || code === 190) {
      throw new Error(
        `Permissão insuficiente no token Meta. Regenere o token em Meta Business Settings → System Users com as permissões "leads_retrieval" e "pages_read_engagement" habilitadas.`
      );
    }
    throw new Error(`Meta API Error (${pagesResponse.status}): ${errorMsg}`);
  }

  const pagesData: MetaPaginatedResponse<MetaPage> = await pagesResponse.json();
  const pages = pagesData.data || [];

  if (pages.length === 0) {
    throw new Error('Nenhuma página encontrada vinculada a esta conta de anúncios. Verifique se a página do Facebook está associada à conta no Meta Business Settings.');
  }

  console.log(`[MetaLeadsFetcher] Found ${pages.length} pages, fetching lead forms...`);

  // 3. For each page, fetch its lead gen forms
  const allForms: MetaLeadForm[] = [];

  for (const page of pages) {
    try {
      const formsUrl = `${META_API.BASE_URL}/${page.id}/leadgen_forms?fields=id,name,status,leads_count&limit=100`;
      const formsResponse = await fetchWithRetry(formsUrl, { headers }, { timeoutMs: META_API.TIMEOUT_MS });

      if (!formsResponse.ok) {
        const errorData = await formsResponse.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || formsResponse.statusText;
        console.warn(`[MetaLeadsFetcher] Could not fetch forms for page ${page.name} (${page.id}): ${errorMsg}`);
        result.errors.push(`Página "${page.name}": ${errorMsg}`);
        continue;
      }

      const formsData: MetaPaginatedResponse<MetaLeadForm> = await formsResponse.json();
      const forms = formsData.data || [];
      console.log(`[MetaLeadsFetcher] Page "${page.name}" has ${forms.length} lead forms`);
      allForms.push(...forms);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[MetaLeadsFetcher] Error fetching forms for page ${page.name}:`, msg);
      result.errors.push(`Página "${page.name}": ${msg}`);
    }
  }

  result.formsFound = allForms.length;

  if (allForms.length === 0) {
    throw new Error('Nenhum formulário de Lead Ads encontrado nas páginas desta conta. Crie uma campanha de Lead Ads no Meta Ads Manager.');
  }

  console.log(`[MetaLeadsFetcher] Found ${allForms.length} forms across ${pages.length} pages`);

  // 4. For each form, fetch leads and write to Firestore
  for (const form of allForms) {
    try {
      const count = await fetchAndStoreFormLeads(brandId, form, headers);
      result.leadsImported += count;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[MetaLeadsFetcher] Error on form ${form.id} (${form.name}):`, msg);
      result.errors.push(`Form "${form.name}": ${msg}`);
    }
  }

  console.log(`[MetaLeadsFetcher] Done: ${result.leadsImported} leads from ${result.formsFound} forms`);
  return result;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetches all leads from a single form (paginated) and writes to Firestore.
 */
async function fetchAndStoreFormLeads(
  brandId: string,
  form: MetaLeadForm,
  headers: Record<string, string>
): Promise<number> {
  let totalImported = 0;
  let nextUrl: string | null =
    `${META_API.BASE_URL}/${form.id}/leads?fields=id,created_time,field_data&limit=${LEADS_PAGE_SIZE}`;

  while (nextUrl && totalImported < LEADS_PER_FORM_CAP) {
    const response = await fetchWithRetry(nextUrl, { headers }, { timeoutMs: META_API.TIMEOUT_MS });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
    }

    const page: MetaPaginatedResponse<MetaLead> = await response.json();
    const leads = page.data || [];

    for (const lead of leads) {
      if (totalImported >= LEADS_PER_FORM_CAP) break;
      await writeLeadToFirestore(brandId, lead, form);
      totalImported++;
    }

    nextUrl = page.paging?.next || null;
  }

  return totalImported;
}

/**
 * Writes a single Meta lead to Firestore in Maestro's data model.
 * Path: brands/{brandId}/leads/{metaLeadId}
 * Idempotent via setDoc(merge: true).
 */
async function writeLeadToFirestore(
  brandId: string,
  lead: MetaLead,
  form: MetaLeadForm
): Promise<void> {
  const createdAt = Timestamp.fromDate(new Date(lead.created_time));
  const fieldMap: Record<string, string> = {};
  for (const field of lead.field_data || []) {
    fieldMap[field.name] = field.values?.[0] || '';
  }

  const leadRef = doc(db, 'brands', brandId, 'leads', lead.id);

  await setDoc(leadRef, {
    brandId,
    currentAwareness: 'PROBLEM_AWARE',
    lastInteraction: {
      type: 'ad_click' as const,
      platform: 'meta' as const,
      timestamp: createdAt,
      metadata: { formId: form.id, formName: form.name },
    },
    tags: ['meta_lead_ads', form.name],
    score: 15,
    metadata: {
      source: 'meta_import',
      formId: form.id,
      formName: form.name,
      fieldData: fieldMap,
    },
    firstSeenAt: createdAt,
    lastInteractionAt: createdAt,
    updatedAt: Timestamp.now(),
  }, { merge: true });

  // Create form submission event
  const eventsRef = collection(db, 'brands', brandId, 'leads', lead.id, 'events');
  await addDoc(eventsRef, {
    type: 'ad_click',
    platform: 'meta',
    timestamp: createdAt,
    awarenessAtTime: 'PROBLEM_AWARE',
    metadata: { formId: form.id, formName: form.name, fieldData: fieldMap },
  });
}
