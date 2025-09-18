// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import {db as prisma} from '@/lib/db'; // Your Prisma Client singleton

export async function GET(req: Request) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      }
    });
    return NextResponse.json(categories, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'Failed to fetch categories', error: error.message },
      { status: 500 }
    );
  }
}