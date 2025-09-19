"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

// Types
interface Notification {
  id: string;
  title: string;
  message: string;
  type:
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "ERROR"
    | "SYSTEM"
    | "ARTICLE_PUBLISHED"
    | "USER_JOINED"
    | "COMMENT_ADDED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  createdAt: string;
  article?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  createNotification: (data: {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    userId: string;
    actionUrl?: string;
    articleId?: string;
  }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const refreshNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=50");
      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/bulk", {
        method: "PUT",
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
      throw error;
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete notification");

      const deletedNotif = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));

      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  };

  // Create notification (admin only)
  const createNotification = async (data: {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    userId: string;
    actionUrl?: string;
    articleId?: string;
  }) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create notification");

      // Refresh notifications to show the new one
      await refreshNotifications();

      toast.success("Notification sent successfully");
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Failed to send notification");
      throw error;
    }
  };

  // Browser notification permission and display
  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id,
      });

      browserNotif.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotif.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => browserNotif.close(), 5000);
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    refreshNotifications();
    requestNotificationPermission();

    const interval = setInterval(refreshNotifications, 30000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array is correct here - we only want this to run once

  // Listen for new notifications via Server-Sent Events (optional enhancement)
  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (event) => {
      const newNotification: Notification = JSON.parse(event.data);
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show browser notification for high priority
      if (
        newNotification.priority === "HIGH" ||
        newNotification.priority === "URGENT"
      ) {
        showBrowserNotification(newNotification);
      }

      // Show toast for all new notifications
      toast.info(newNotification.title, {
        description: newNotification.message,
        action: newNotification.actionUrl
          ? {
              label: "View",
              onClick: () =>
                (window.location.href = newNotification.actionUrl!),
            }
          : undefined,
      });
    };

    eventSource.onerror = () => {
      console.log("Notification stream disconnected");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
