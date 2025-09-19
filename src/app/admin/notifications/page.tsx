"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Send,
  TestTube,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Demo notification creator
const NotificationDemo = () => {
  const { createNotification } = useNotifications();
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "INFO",
    priority: "NORMAL",
    userId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.message || !formData.userId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createNotification(formData);
      setFormData({
        title: "",
        message: "",
        type: "INFO",
        priority: "NORMAL",
        userId: "",
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const sendTestNotification = async (type: string) => {
    const testNotifications = {
      success: {
        title: "Test Success Notification",
        message:
          "This is a test success notification to demonstrate the system.",
        type: "SUCCESS",
        priority: "NORMAL",
        userId: formData.userId || "test-user-id",
      },
      warning: {
        title: "Test Warning Notification",
        message:
          "This is a test warning notification to demonstrate the system.",
        type: "WARNING",
        priority: "HIGH",
        userId: formData.userId || "test-user-id",
      },
      error: {
        title: "Test Error Notification",
        message: "This is a test error notification to demonstrate the system.",
        type: "ERROR",
        priority: "URGENT",
        userId: formData.userId || "test-user-id",
      },
      system: {
        title: "System Maintenance Alert",
        message:
          "Scheduled maintenance will begin in 30 minutes. Please save your work.",
        type: "SYSTEM",
        priority: "HIGH",
        userId: formData.userId || "test-user-id",
      },
    };

    const notification =
      testNotifications[type as keyof typeof testNotifications];

    if (!notification) return;

    try {
      await createNotification(notification);
      toast.success(`${type} notification sent!`);
    } catch {
      toast.error("Failed to send test notification");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Test Notification System
        </CardTitle>
        <CardDescription>
          Create and send test notifications to verify the system is working
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Test Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendTestNotification("success")}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4 text-green-600" />
            Success
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendTestNotification("warning")}
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Warning
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendTestNotification("error")}
            className="gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600" />
            Error
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendTestNotification("system")}
            className="gap-2"
          >
            <Settings className="w-4 h-4 text-blue-600" />
            System
          </Button>
        </div>

        {/* Custom Notification Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter notification title"
                required
              />
            </div>
            <div>
              <Label htmlFor="userId">Target User ID</Label>
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                placeholder="Enter user ID or leave empty for current user"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Enter notification message"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Notification Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                  <SelectItem value="ARTICLE_PUBLISHED">
                    Article Published
                  </SelectItem>
                  <SelectItem value="USER_JOINED">User Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full gap-2">
            <Send className="w-4 h-4" />
            Send Custom Notification
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Notification Statistics
const NotificationStats = () => {
  const { notifications, unreadCount } = useNotifications();

  const typeStats = notifications.reduce((acc, notif) => {
    acc[notif.type] = (acc[notif.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityStats = notifications.reduce((acc, notif) => {
    acc[notif.priority] = (acc[notif.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Statistics
        </CardTitle>
        <CardDescription>
          Overview of your notification system activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {notifications.length}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <div className="text-sm text-muted-foreground">Unread</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {notifications.length - unreadCount}
            </div>
            <div className="text-sm text-muted-foreground">Read</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((1 - unreadCount / notifications.length) * 100) || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Read Rate</div>
          </div>
        </div>

        {/* Type Breakdown */}
        <div>
          <h4 className="font-medium mb-3">By Type</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeStats).map(([type, count]) => (
              <Badge key={type} variant="secondary">
                {type}: {count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div>
          <h4 className="font-medium mb-3">By Priority</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(priorityStats).map(([priority, count]) => (
              <Badge
                key={priority}
                variant={
                  priority === "URGENT"
                    ? "destructive"
                    : priority === "HIGH"
                    ? "default"
                    : "outline"
                }
              >
                {priority}: {count}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main notifications page
const NotificationsPage = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notification System Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage and test the notification system for your application
        </p>
      </div>

      <Tabs defaultValue="demo" className="space-y-6">
        <TabsList>
          <TabsTrigger value="demo">Test Notifications</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="demo">
          <NotificationDemo />
        </TabsContent>

        <TabsContent value="stats">
          <NotificationStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage;
