// app/api/admin/articles/[id]/route.ts
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { getAuthSession } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { isSuperAdmin, normalizeAdminRole } from '@/lib/roles';

// Helper to extract ID from URL
function getArticleIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/admin\/articles\/([^/]+)(?:\/.*)?$/);
  return match ? match[1] : null;
}

// GET - Retrieve a single article by ID
export async function GET(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const articleId = getArticleIdFromUrl(new URL(req.url).pathname);
  if (!articleId) {
    return NextResponse.json({ message: 'Invalid article ID' }, { status: 400 });
  }

  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        category: true,
      },
    });

    if (!article) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error(`Error fetching article ${articleId}:`, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to retrieve article', error: message },
      { status: 500 }
    );
  }
}

// PUT - Update an article
export async function PUT(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const role = normalizeAdminRole(session.user.role);
  if (!isSuperAdmin(role)) {
    return NextResponse.json(
      { message: 'Only Super Admins can update articles.' },
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
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    // Extract fields from request body
    const {
      title,
      slug,
      content,
      editorData, // Editor.js structured data
      status,
      isBreakingNews,
      isTopRated,
      featuredImageUrl,
      categoryId,
    } = body;

    // Basic validation
    if (!title || !slug || !content) {
      return NextResponse.json(
        { message: 'Title, slug, and content are required fields' },
        { status: 400 }
      );
    }

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }

    // Check if the slug is already in use by another article
    const slugExists = await prisma.article.findFirst({
      where: {
        slug,
        id: { not: articleId }, // Exclude the current article
      },
      select: { id: true },
    });

    if (slugExists) {
      return NextResponse.json(
        { message: `Slug "${slug}" is already in use by another article` },
        { status: 400 }
      );
    }

    // Update the article
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        title,
        slug,
        content,
        editorData, // Store Editor.js JSON data
        status: status || undefined,
        isBreakingNews: isBreakingNews !== undefined ? isBreakingNews : undefined,
        isTopRated: isTopRated !== undefined ? isTopRated : undefined,
        featuredImageUrl: featuredImageUrl || null,
        categoryId: categoryId || null,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        category: true,
      },
    });

    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error(`Error updating article ${articleId}:`, error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ message: 'Article not found' }, { status: 404 });
      }
      if (error.code === 'P2002' && error.meta?.target === 'slug') {
        return NextResponse.json({ message: 'Slug is already in use' }, { status: 400 });
      }
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to update article', error: message },
      { status: 500 }
    );
  }
}