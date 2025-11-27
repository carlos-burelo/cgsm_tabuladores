import { db } from "../db";
import { logger } from "../logger";
import { getRedisClient } from "../redis";

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

const NOTIFICATION_CHANNEL = "notifications";

export class NotificationService {
  async notify(payload: NotificationPayload): Promise<void> {
    try {
      const notification = await db.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data || null,
        },
      });

      try {
        const redis = await getRedisClient();
        await redis.publish(NOTIFICATION_CHANNEL, JSON.stringify(notification));
      } catch (error) {
        logger.warn("Failed to publish notification to Redis", error);
      }
    } catch (error) {
      logger.error("Failed to create notification", error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, limit = 50) {
    try {
      return await db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } catch (error) {
      logger.error("Failed to fetch notifications", error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await db.notification.update({
        where: { id: notificationId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      logger.error("Failed to mark notification as read", error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await db.notification.updateMany({
        where: { userId, read: false },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      logger.error("Failed to mark all notifications as read", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
