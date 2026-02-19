/**
 * Content Templates API — CRUD for reusable post templates
 * Sprint M — M-4.1
 *
 * @route /api/content/calendar/templates
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import {
  createContentTemplate,
  getContentTemplates,
  deleteContentTemplate,
} from '@/lib/firebase/content-templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get('brandId');
    if (!brandId) return createApiError(400, 'brandId is required');

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const templates = await getContentTemplates(brandId);
    return createApiSuccess({ templates });
  } catch (error) {
    console.error('[Templates] GET error:', error);
    return createApiError(500, 'Failed to fetch templates');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, title, format, platform, content, pillar, tags } = body;

    if (!brandId || !title || !format || !platform || !content) {
      return createApiError(400, 'Missing required fields: brandId, title, format, platform, content');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const template = await createContentTemplate(brandId, {
      title,
      format,
      platform,
      content,
      pillar,
      tags,
    });

    return createApiSuccess({ template });
  } catch (error) {
    console.error('[Templates] POST error:', error);
    return createApiError(500, 'Failed to create template');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, templateId } = body;

    if (!brandId || !templateId) {
      return createApiError(400, 'brandId and templateId are required');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    await deleteContentTemplate(brandId, templateId);
    return createApiSuccess({ deleted: true, templateId });
  } catch (error) {
    console.error('[Templates] DELETE error:', error);
    return createApiError(500, 'Failed to delete template');
  }
}
