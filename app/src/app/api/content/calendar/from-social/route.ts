/**
 * Calendar From Social API — Create calendar items from approved social hooks
 * Sprint M — M-3.1, M-3.2
 *
 * @route POST /api/content/calendar/from-social
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createCalendarItem } from '@/lib/firebase/content-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Map social platform strings to calendar platform type */
function mapPlatform(platform: string): 'instagram' | 'linkedin' | 'x' | 'tiktok' {
  const p = platform.toLowerCase();
  if (p.includes('instagram') || p.includes('reels')) return 'instagram';
  if (p.includes('linkedin')) return 'linkedin';
  if (p.includes('twitter') || p === 'x') return 'x';
  if (p.includes('tiktok')) return 'tiktok';
  return 'instagram';
}

/** Map post type to calendar format */
function mapFormat(postType?: string): 'post' | 'story' | 'carousel' | 'reel' {
  if (!postType) return 'post';
  const pt = postType.toLowerCase();
  if (pt.includes('reel') || pt.includes('video') || pt.includes('short')) return 'reel';
  if (pt.includes('carousel') || pt.includes('carrossel')) return 'carousel';
  if (pt.includes('story') || pt.includes('stories')) return 'story';
  return 'post';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, hooks, campaignType } = body;

    if (!brandId || !hooks || !Array.isArray(hooks) || hooks.length === 0) {
      return createApiError(400, 'brandId and hooks array are required');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const createdItems = [];
    const now = new Date();

    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i];
      // Schedule items across the next 7 days
      const scheduledDate = new Date(now);
      scheduledDate.setDate(now.getDate() + i + 1);
      scheduledDate.setHours(10, 0, 0, 0); // Default to 10:00 AM

      const item = await createCalendarItem(brandId, {
        title: `[${hook.style || campaignType || 'Social'}] ${hook.content.slice(0, 60)}${hook.content.length > 60 ? '...' : ''}`,
        format: mapFormat(hook.postType),
        platform: mapPlatform(hook.platform || ''),
        scheduledDate: Timestamp.fromDate(scheduledDate),
        content: hook.content,
        metadata: {
          generatedBy: 'ai',
          promptParams: {
            source: 'social_hooks',
            campaignType: campaignType || 'organic',
            style: hook.style || '',
          },
        },
        order: i,
      });

      createdItems.push(item);
    }

    return createApiSuccess({ items: createdItems, count: createdItems.length });
  } catch (error: any) {
    console.error('[Calendar/FromSocial] POST error:', error);
    return createApiError(500, 'Failed to create calendar items from social hooks', {
      details: error?.message || String(error),
      stack: error?.stack?.split('\n').slice(0, 3).join(' | '),
    });
  }
}
