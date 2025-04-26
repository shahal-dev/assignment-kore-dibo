import { db } from './db';
import { notifications } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

export async function createNotification(userId: number, type: string, message: string, link?: string) {
  return await db.insert(notifications).values({ userId, type, message, link, read: false }).returning();
}

export async function getNotifications(userId: number) {
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(notificationId: number) {
  return await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsRead(userId: number) {
  return await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
}
