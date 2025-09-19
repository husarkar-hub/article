// app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { NotificationType, NotificationPriority } from '@prisma/client';

// GET - Fetch user notifications
export async function GET(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') as NotificationType | null;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type) {
      where.type = type;
    }

    // Fetch notifications with pagination
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Create a new notification
export async function POST(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  // Only admins can create notifications for other users
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { message: 'Insufficient permissions.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      title,
      message,
      type = 'INFO',
      priority = 'NORMAL',
      userId,
      actionUrl,
      articleId,
      metadata,
    } = body;

    // Validation
    if (!title || !message || !userId) {
      return NextResponse.json(
        { message: 'Title, message, and userId are required.' },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: 'Target user not found.' },
        { status: 404 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type as NotificationType,
        priority: priority as NotificationPriority,
        userId,
        actionUrl,
        articleId,
        metadata,
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

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { message: 'Failed to create notification' },
      { status: 500 }
    );
  }
}