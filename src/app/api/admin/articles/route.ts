// app/api/admin/articles/route.ts
import { NextResponse } from 'next/server';

import { getAuthSession } from '@/lib/auth';
import { db as prisma} from '@/lib/db';
import { isStaff, normalizeAdminRole } from '@/lib/roles';



export async function GET() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const role = normalizeAdminRole(session.user.role);

  if (!role || !isStaff(role)) {
    return NextResponse.json(
      { message: 'You do not have permission to view administrative articles.' },
      { status: 403 }
    );
  }

  try {
    const articles = await prisma.article.findMany({
      orderBy: {
        createdAt: 'desc', 
      },
      include: {
        author: {
          select: {
            email: true,
            id: true
          }
        },
        category: {
          select: {
            name: true,
            id: true
          }
        }
      }
    });
    return NextResponse.json(articles, { status: 200 });
  } catch (error) {
    console.error('Error fetching articles:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to fetch articles', error: message },
      { status: 500 }
    );
  }
}


export async function POST() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function PUT() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }