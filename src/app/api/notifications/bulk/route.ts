// app/api/notifications/bulk/route.ts
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// POST - Bulk operations on notifications
export async function POST(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, notificationIds } = body;

    if (!action || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { message: 'Action and notificationIds array are required.' },
        { status: 400 }
      );
    }

    // Verify all notifications belong to the user
    const notifications = await prisma.notification.findMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id,
      },
    });

    if (notifications.length !== notificationIds.length) {
      return NextResponse.json(
        { message: 'Some notifications not found or access denied.' },
        { status: 403 }
      );
    }

    let result;

    switch (action) {
      case 'markAllRead':
        result = await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
        break;

      case 'markAllUnread':
        result = await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id,
          },
          data: {
            isRead: false,
            readAt: null,
          },
        });
        break;

      case 'deleteAll':
        result = await prisma.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            userId: session.user.id,
          },
        });
        break;

      default:
        return NextResponse.json(
          { message: 'Invalid action. Supported actions: markAllRead, markAllUnread, deleteAll' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Successfully ${action} ${result.count} notifications`,
      affectedCount: result.count,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { message: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

// PUT - Mark all notifications as read for a user
export async function PUT(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Marked ${result.count} notifications as read`,
      affectedCount: result.count,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { message: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}