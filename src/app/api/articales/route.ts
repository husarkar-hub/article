// app/api/articles/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // Adjust the import based on your project structure

export async function GET(req: Request) {
  try {
    const articles = await db.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' }, // Consider using publishedAt for ordering public articles
      select: { // Select fields directly from the Article model
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
        isBreakingNews: true, // Map this to 'isBreaking' in frontend
        views: true,
        // Use 'include' for relations and specify their fields there
        author: { // Specify which fields from the related 'author' model to fetch
          select: {
            email: true, // Assuming you want the author's name, not email for public display
            // If you only had email in author relation, use that: email: true,
          }
        },
        category: { // Specify which fields from the related 'category' model to fetch
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
      // Safely access author name, fallback if author or author.name is missing
      author: article.author ? article.author.name || 'Unknown Author' : 'Unknown Author',
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString() : null,
      // Safely access category name, fallback if category or category.name is missing
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