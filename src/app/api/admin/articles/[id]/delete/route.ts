// app/api/admin/articles/[id]/route.ts
import { NextResponse } from 'next/server';

import { getAuthSession } from '@/lib/auth';
import {db as prisma} from '@/lib/db';
import { isSuperAdmin, normalizeAdminRole } from '@/lib/roles';



function getArticleIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/admin\/articles\/([^/]+)/);
  return match ? match[1] : null;
}

export async function DELETE(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const role = normalizeAdminRole(session.user.role);

  if (!isSuperAdmin(role)) {
    return NextResponse.json(
      { message: 'Only Super Admins can delete articles.' },
      { status: 403 }
    );
  }

  const articleId = getArticleIdFromUrl(new URL(req.url).pathname);
  if (!articleId) {
    return NextResponse.json({ message: 'Invalid article ID' }, { status: 400 });
  }

  try {
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }

    await prisma.article.delete({
      where: { id: articleId },
    });

    return NextResponse.json({ message: `Article ${articleId} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting article ${articleId}:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to delete article', error: message },
      { status: 500 }
    );
  }
}


export async function GET() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function PUT() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function POST() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }