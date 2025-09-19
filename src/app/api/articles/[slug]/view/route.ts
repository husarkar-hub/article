import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Increment view count for article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;


    const article = await db.article.findUnique({
      where: {
        slug: slug,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        views: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { message: 'Article not found' },
        { status: 404 }
      );
    }

    // Log before increment
    console.log(`Incrementing view for article slug: ${slug}, current views: ${article.views}`);

    // Increment the view count
    const updatedArticle = await db.article.update({
      where: {
        slug: slug,
      },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        views: true,
      },
    });

    console.log(`View incremented for slug: ${slug}, new views: ${updatedArticle.views}`);

    return NextResponse.json({
      message: 'View count incremented',
      views: updatedArticle.views,
    }, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Database error';
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      { message: 'Failed to increment view count', error: errorMessage },
      { status: 500 }
    );
  }
}

// Block other methods
export async function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}