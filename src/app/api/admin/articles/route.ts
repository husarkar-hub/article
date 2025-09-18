// app/api/admin/articles/route.ts
import { NextResponse } from 'next/server';
import { db as prisma} from '@/lib/db'; 



export async function GET(req: Request) {
 
  try {
    const articles = await prisma.article.findMany({
      orderBy: {
        createdAt: 'desc', 
      },
      // You might want to select specific fields if your Article model is very large
      // select: {
      //   id: true,
      //   title: true,
      //   slug: true,
      //   author: { select: { name: true } }, // Example if you have an Author relation
      //   publishedAt: true,
      //   status: true,
      //   views: true,
      //   comments: true,
      //   isBreaking: true,
      //   isTopRated: true,
      // }
    });
    return NextResponse.json(articles, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { message: 'Failed to fetch articles', error: error.message },
      { status: 500 }
    );
  }
}


export async function POST() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function PUT() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }