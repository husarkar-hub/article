// app/api/admin/articles/[id]/route.ts
import { NextResponse } from 'next/server';
import {db as prisma} from '@/lib/db';



function getArticleIdFromUrl(url: string): string | null {
  const match = url.match(/\/api\/admin\/articles\/([^/]+)/);
  return match ? match[1] : null;
}

export async function DELETE(req: Request) {


  const articleId = getArticleIdFromUrl(new URL(req.url).pathname);
  if (!articleId) {
    return NextResponse.json({ message: 'Invalid article ID' }, { status: 400 });
  }

  try {
 

    await prisma.article.delete({
      where: { id: articleId },
    });

    return NextResponse.json({ message: `Article ${articleId} deleted successfully` }, { status: 200 });

  } catch (error: any) {
    console.error(`Error deleting article ${articleId}:`, error);
    if (error.code === 'P2025') { 
        return NextResponse.json({ message: 'Article not found' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to delete article', error: error.message },
      { status: 500 }
    );
  }
}


export async function GET() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function PUT() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function POST() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }