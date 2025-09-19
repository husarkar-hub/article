
import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';




export async function GET(_req: Request) {

  try {
    
    const publishedCount = await prisma.article.count({
      where: { status: 'PUBLISHED' },
    });
    const draftCount = await prisma.article.count({
      where: { status: 'DRAFT' }, 
    });
    const archivedCount = await prisma.article.count({
      where: { status: 'ARCHIVED' },
    });

    
    const aggregatedData = await prisma.article.aggregate({
      _sum: {
        views: true,
      
      },
      _count: {
        id: true, 
      },
   
    });


    const breakingNewsCount = await prisma.article.count({
      where: {
        status: 'PUBLISHED',
        isBreakingNews: true,
      },
    });
    const topRatedCount = await prisma.article.count({
      where: {
        status: 'PUBLISHED', 
        isTopRated: true, 
      },
    });

    const metrics = {
      
      totalArticles: await prisma.article.count(), 
      publishedArticles: publishedCount,
      draftArticles: draftCount,
      archivedArticles: archivedCount,
      totalViews: aggregatedData._sum.views || 0,
   
      breakingNewsCount: breakingNewsCount,
      topRatedCount: topRatedCount,
    };

    return NextResponse.json(metrics, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard metrics', error: error.message },
      { status: 500 }
    );
  }
}

// Block other methods as they are not intended for this endpoint
export async function POST() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function PUT() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }