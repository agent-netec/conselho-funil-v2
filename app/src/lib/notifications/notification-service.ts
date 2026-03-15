import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';

export type NotificationType =
  | 'funnel_review'
  | 'proposals_generated'
  | 'automation_action'
  | 'content_ready'
  | 'update';

export interface NotificationPayload {
  brandId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Creates an in-app notification, respecting user preferences.
 * Collection: brands/{brandId}/notifications
 */
export async function createNotification(payload: NotificationPayload): Promise<string | null> {
  try {
    // Check user notification preferences
    const prefsMatch = await checkNotificationPreference(payload.userId, payload.type);
    if (!prefsMatch) {
      console.log(`[Notifications] User ${payload.userId} has disabled ${payload.type} notifications`);
      return null;
    }

    const adminDb = getAdminFirestore();
    const notificationsRef = adminDb.collection('brands').doc(payload.brandId).collection('notifications');
    const docRef = await notificationsRef.add({
      ...payload,
      read: false,
      createdAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error);
    return null;
  }
}

/**
 * Checks if user has enabled notifications for a given type.
 * Reads from users/{uid}/preferences or falls back to enabled.
 */
async function checkNotificationPreference(userId: string, type: NotificationType): Promise<boolean> {
  try {
    const adminDb = getAdminFirestore();
    const prefsRef = adminDb.collection('users').doc(userId);
    const snap = await prefsRef.get();

    if (!snap.exists) return true;

    const prefs = snap.data()?.preferences?.notifications;
    if (!prefs) return true;

    const typeMap: Record<NotificationType, keyof typeof prefs> = {
      funnel_review: 'funnelReview',
      proposals_generated: 'proposalsGenerated',
      automation_action: 'updates',
      content_ready: 'proposalsGenerated',
      update: 'updates',
    };

    const prefKey = typeMap[type];
    return prefs[prefKey] !== false;
  } catch {
    return true; // Default to enabled on error
  }
}

/**
 * Gets unread notification count for a brand.
 */
export async function getUnreadCount(brandId: string): Promise<number> {
  try {
    const adminDb = getAdminFirestore();
    const notificationsRef = adminDb.collection('brands').doc(brandId).collection('notifications');
    const snap = await notificationsRef.where('read', '==', false).get();
    return snap.size;
  } catch {
    return 0;
  }
}
