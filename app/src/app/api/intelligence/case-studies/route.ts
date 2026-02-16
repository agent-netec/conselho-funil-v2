export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { createCaseStudy, getBrandCaseStudies, deleteCaseStudy } from '@/lib/firebase/case-studies';
import type { CreateCaseStudyInput } from '@/types/case-studies';

/**
 * POST /api/intelligence/case-studies — Create a case study
 * GET /api/intelligence/case-studies?brandId=xxx — List case studies
 * DELETE /api/intelligence/case-studies — Delete a case study
 *
 * Shared by Spy Agent (N-3) and Page Forensics (N-4)
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody<CreateCaseStudyInput>(req);
    if (!parsed.ok) {
      return createApiError(400, parsed.error);
    }

    const data = parsed.data;
    if (!data.brandId || !data.url || !data.title) {
      return createApiError(400, 'brandId, url e title são obrigatórios');
    }

    await requireBrandAccess(req, data.brandId);

    const id = await createCaseStudy(data);

    return createApiSuccess({ id, message: 'Estudo de caso salvo com sucesso' });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    const message = error instanceof Error ? error.message : 'Erro ao salvar estudo de caso';
    return createApiError(500, message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    await requireBrandAccess(req, brandId);

    const caseStudies = await getBrandCaseStudies(brandId);

    return createApiSuccess({ caseStudies, count: caseStudies.length });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    const message = error instanceof Error ? error.message : 'Erro ao buscar estudos de caso';
    return createApiError(500, message);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const parsed = await parseJsonBody<{ brandId?: string; caseStudyId?: string }>(req);
    if (!parsed.ok) {
      return createApiError(400, parsed.error);
    }

    const { brandId, caseStudyId } = parsed.data;
    if (!brandId || !caseStudyId) {
      return createApiError(400, 'brandId e caseStudyId são obrigatórios');
    }

    await requireBrandAccess(req, brandId);
    await deleteCaseStudy(brandId, caseStudyId);

    return createApiSuccess({ message: 'Estudo de caso removido' });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    const message = error instanceof Error ? error.message : 'Erro ao remover estudo de caso';
    return createApiError(500, message);
  }
}
