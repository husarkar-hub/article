// app/api/admin/articles/[id]/status/route.ts
import { NextResponse } from 'next/server';
import {db as prisma} from '@/lib/db';
import { Article } from '@prisma/client'; // Import the Article type



// Helper to extract ID from URL (App Router specific)
function getArticleIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/admin\/articles\/([^/]+)\/status/);
  return match ? match[1] : null;
}

export async function PUT(req: Request) {


  const articleId = getArticleIdFromUrl(new URL(req.url).pathname);
  if (!articleId) {
    return NextResponse.json({ message: 'Invalid article ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    // --- Validation ---
    const validStatuses: Article['status'][] = ['PUBLISHED', 'DRAFT', 'ARCHIVED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status provided', validStatuses },
        { status: 400 }
      );
    }

    // --- Update Logic ---
    // Optionally set publishedAt when status becomes 'Published'
    let updateData: any = { status };
    if (status === 'Published') {
      // Check if it's currently not published and set publishedAt to now
      const existingArticle = await prisma.article.findUnique({ where: { id: articleId }, select: { status: true, publishedAt: true } });
      if (existingArticle && existingArticle.status !== 'PUBLISHED' && !existingArticle.publishedAt) {
        updateData.publishedAt = new Date();
      }
    } else if (status === 'Draft' || status === 'Archived') {
      // Optionally clear publishedAt if it's no longer 'Published'
      // This logic depends on your requirements. For now, we only set it.
      // If you want to clear it:
      // updateData.publishedAt = null;
    }


    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
    });

    return NextResponse.json(updatedArticle, { status: 200 });

  } catch (error: any) {
    console.error(`Error updating status for article ${articleId}:`, error);
    if (error.code === 'P2025') { // Prisma error for record not found
        return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to update article status', error: error.message },
      { status: 500 }
    );
  }
}

// Optional: Block other methods
export async function GET() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }