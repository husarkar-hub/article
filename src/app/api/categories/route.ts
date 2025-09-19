// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import {db as prisma} from '@/lib/db'; // Your Prisma Client singleton

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      }
    });
    return NextResponse.json(categories, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'Failed to fetch categories', error: errorMessage },
      { status: 500 }
    );
  }
}