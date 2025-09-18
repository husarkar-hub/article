// app/api/admin/articles/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { Prisma, ArticleStatus } from '@prisma/client';

import { getAuthSession } from '@/lib/auth';
import {db as prisma} from '@/lib/db';
import { isSuperAdmin, normalizeAdminRole } from '@/lib/roles';



// Helper to extract ID from URL (App Router specific)
function getArticleIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/admin\/articles\/([^/]+)\/status/);
  return match ? match[1] : null;
}

export async function PUT(req: Request) {
  const session = await getAuthSession();
console.log(session);
  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const role = normalizeAdminRole(session.user.role);

  if (!isSuperAdmin(role)) {
    return NextResponse.json(
      { message: 'Only Super Admins can update article status.' },
      { status: 403 }
    );
  }

  const articleId = getArticleIdFromUrl(new URL(req.url).pathname);
  if (!articleId) {
    return NextResponse.json({ message: 'Invalid article ID' }, { status: 400 });
  }

  try {
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { message: 'Invalid status payload provided.' },
        { status: 400 }
      );
    }

    const rawStatus = (body as Record<string, unknown>).status;

    if (typeof rawStatus !== 'string') {
      return NextResponse.json(
        { message: 'Invalid status provided', validStatuses: Object.values(ArticleStatus) },
        { status: 400 }
      );
    }

    const normalizedStatus = rawStatus
      .toUpperCase()
      .replace(/[\s-]+/g, '_') as ArticleStatus;

    const validStatuses = Object.values(ArticleStatus);
    if (!normalizedStatus || !validStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        { message: 'Invalid status provided', validStatuses },
        { status: 400 }
      );
    }

    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      select: { status: true, publishedAt: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status: normalizedStatus };

    if (normalizedStatus === ArticleStatus.PUBLISHED) {
      if (
        existingArticle.status !== ArticleStatus.PUBLISHED ||
        !existingArticle.publishedAt
      ) {
        updateData.publishedAt = new Date();
      }
    } else {
      updateData.publishedAt = null;
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
    });

    return NextResponse.json(updatedArticle, { status: 200 });
  } catch (error) {
    console.error(`Error updating status for article ${articleId}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to update article status', error: message },
      { status: 500 }
    );
  }
}

// Optional: Block other methods
export async function GET() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }