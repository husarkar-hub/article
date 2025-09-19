// app/api/admin/logs/route.ts

import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

const isAdmin = (req: Request): boolean => {
  console.warn("Admin check is basic for demo. Implement proper authentication!");
  return true; 
};

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.articleVisitLog.count();
    
    // Get paginated logs
    const logs = await prisma.articleVisitLog.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        visitTimestamp: 'desc', 
      },
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    const response = {
      data: logs,
      pagination: {
        currentPage: page,
        totalPages,
        total: totalCount,
        limit,
        hasMore,
        offset
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { message: 'Failed to fetch logs', error: error.message },
      { status: 500 }
    );
  }
}

// Optional: Block other methods if not needed
export async function POST() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}