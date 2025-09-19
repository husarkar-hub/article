// app/api/articles/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Adjust the import based on your project structure

export async function GET(req: Request) {
  try {
    const articles = await db.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' }, // Order by publishedAt for better public display
      include: {
        author: {
          select: {
            email: true,
          }
        },
        category: {
          select: {
            name: true,
          }
        },
      },
    });

    // Map the data to match the frontend's Article interface expectations
    const formattedArticles = articles.map((article: any) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      // Use email prefix as author name since schema doesn't have name field
      author: article.author ? article.author.email.split('@')[0] : 'Unknown Author',
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString() : null,
      // Safely access category name, fallback if category is missing
      category: article.category ? article.category.name : 'Uncategorized',
      isBreaking: article.isBreakingNews || false, // Map schema field to frontend prop
      views: article.views,
    }));

    return NextResponse.json(formattedArticles, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching public articles:', error);
    return NextResponse.json(
      { message: 'Failed to fetch articles', error: error.message },
      { status: 500 }
    );
  }
}