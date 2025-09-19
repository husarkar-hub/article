// lib/notifications.ts
import { db as prisma } from '@/lib/db';
import { NotificationType, NotificationPriority } from '@prisma/client';

interface CreateNotificationOptions {
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  userId: string;
  actionUrl?: string;
  articleId?: string;
  metadata?: any;
}

// Create a single notification
export async function createNotification(options: CreateNotificationOptions) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title: options.title,
        message: options.message,
        type: options.type || NotificationType.INFO,
        priority: options.priority || NotificationPriority.NORMAL,
        userId: options.userId,
        actionUrl: options.actionUrl,
        articleId: options.articleId,
        metadata: options.metadata,
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Create notifications for multiple users
export async function createBulkNotifications(
  userIds: string[],
  options: Omit<CreateNotificationOptions, 'userId'>
) {
  try {
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        title: options.title,
        message: options.message,
        type: options.type || NotificationType.INFO,
        priority: options.priority || NotificationPriority.NORMAL,
        userId,
        actionUrl: options.actionUrl,
        articleId: options.articleId,
        metadata: options.metadata,
      })),
    });

    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
}

// Notification templates for common scenarios
export const NotificationTemplates = {
  // Article published notification
  articlePublished: (authorId: string, articleTitle: string, articleSlug: string, articleId: string) => ({
    title: 'Article Published',
    message: `Your article "${articleTitle}" has been published successfully!`,
    type: NotificationType.ARTICLE_PUBLISHED,
    priority: NotificationPriority.NORMAL,
    userId: authorId,
    actionUrl: `/articles/${articleSlug}`,
    articleId,
  }),

  // New user joined notification (for admins)
  userJoined: (adminId: string, newUserEmail: string, newUserRole: string) => ({
    title: 'New User Joined',
    message: `${newUserEmail} has joined as ${newUserRole}`,
    type: NotificationType.USER_JOINED,
    priority: NotificationPriority.LOW,
    userId: adminId,
    actionUrl: '/admin/users',
  }),

  // System maintenance notification
  systemMaintenance: (userId: string, maintenanceDate: string) => ({
    title: 'Scheduled Maintenance',
    message: `System maintenance scheduled for ${maintenanceDate}. Expect brief downtime.`,
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.HIGH,
    userId,
  }),

  // Article status changed
  articleStatusChanged: (authorId: string, articleTitle: string, newStatus: string, articleSlug: string, articleId: string) => ({
    title: 'Article Status Updated',
    message: `Your article "${articleTitle}" status changed to ${newStatus}`,
    type: NotificationType.INFO,
    priority: NotificationPriority.NORMAL,
    userId: authorId,
    actionUrl: `/articles/${articleSlug}`,
    articleId,
  }),

  // Breaking news alert
  breakingNews: (userId: string, articleTitle: string, articleSlug: string, articleId: string) => ({
    title: 'Breaking News Alert',
    message: `New breaking news: ${articleTitle}`,
    type: NotificationType.INFO,
    priority: NotificationPriority.URGENT,
    userId,
    actionUrl: `/articles/${articleSlug}`,
    articleId,
  }),

  // Weekly digest notification
  weeklyDigest: (userId: string, articleCount: number) => ({
    title: 'Weekly Digest',
    message: `${articleCount} new articles published this week. Check them out!`,
    type: NotificationType.INFO,
    priority: NotificationPriority.LOW,
    userId,
    actionUrl: '/articles',
  }),

  // Error notification
  systemError: (userId: string, errorMessage: string) => ({
    title: 'System Error',
    message: errorMessage,
    type: NotificationType.ERROR,
    priority: NotificationPriority.HIGH,
    userId,
    actionUrl: '/admin/logs',
  }),
};

// Helper functions for common notification scenarios
export class NotificationService {
  // Notify when article is published
  static async notifyArticlePublished(articleId: string, authorId: string) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { title: true, slug: true, isBreakingNews: true },
      });

      if (!article) return;

      // Notify author
      await createNotification(
        NotificationTemplates.articlePublished(authorId, article.title, article.slug, articleId)
      );

      // If breaking news, notify all admins
      if (article.isBreakingNews) {
        const admins = await prisma.user.findMany({
          where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
          select: { id: true },
        });

        await createBulkNotifications(
          admins.map(admin => admin.id),
          NotificationTemplates.breakingNews('', article.title, article.slug, articleId)
        );
      }
    } catch (error) {
      console.error('Error notifying article published:', error);
    }
  }

  // Notify when new user joins
  static async notifyUserJoined(newUserEmail: string, newUserRole: string) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
        select: { id: true },
      });

      await createBulkNotifications(
        admins.map(admin => admin.id),
        NotificationTemplates.userJoined('', newUserEmail, newUserRole)
      );
    } catch (error) {
      console.error('Error notifying user joined:', error);
    }
  }

  // Notify article status change
  static async notifyArticleStatusChanged(articleId: string, authorId: string, newStatus: string) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { title: true, slug: true },
      });

      if (!article) return;

      await createNotification(
        NotificationTemplates.articleStatusChanged(authorId, article.title, newStatus, article.slug, articleId)
      );
    } catch (error) {
      console.error('Error notifying article status changed:', error);
    }
  }

  // Send system maintenance notification to all users
  static async notifySystemMaintenance(maintenanceDate: string) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      await createBulkNotifications(
        users.map(user => user.id),
        NotificationTemplates.systemMaintenance('', maintenanceDate)
      );
    } catch (error) {
      console.error('Error notifying system maintenance:', error);
    }
  }

  // Clean up old notifications (run this periodically)
  static async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isRead: true,
        },
      });

      console.log(`Cleaned up ${result.count} old notifications`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return 0;
    }
  }
}