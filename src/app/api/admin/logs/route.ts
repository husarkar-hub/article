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
    
    const logs = await prisma.articleVisitLog.findMany({
      take: 100, 
      orderBy: {
        visitTimestamp: 'desc', 
      },
    });

    

    return NextResponse.json(logs, { status: 200 });

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