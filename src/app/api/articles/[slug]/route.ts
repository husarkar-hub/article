import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch individual article by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const article = await db.article.findUnique({
      where: {
        slug: slug,
        status: 'PUBLISHED', // Only show published articles
      },
      include: {
        author: {
          select: {
            email: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { message: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(article, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Database error';
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { message: 'Failed to fetch article', error: errorMessage },
      { status: 500 }
    );
  }
}

// Block other methods
export async function POST() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}