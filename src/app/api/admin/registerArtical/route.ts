// app/api/articles/route.ts (for App Router)
// OR
// pages/api/articles.ts (for Pages Router)

import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth"; // Adjust path as needed
import { db } from "@/lib/db"; // Adjust path as needed
import { Prisma, ArticleStatus } from "@prisma/client"; // Import enums

import { ADMIN_ROLE, SUPER_ADMIN_ROLE, normalizeAdminRole } from "@/lib/roles";
import { prismaErrorTargetsInclude } from "@/lib/prisma";

// --- Function to handle POST requests to create an article ---
export async function POST(request: Request) {
  const session = await getAuthSession();

  // 1. Authentication Check
  // Ensure the user is logged in and has appropriate roles (e.g., EDITOR or SUPER_ADMIN)
  if (!session || !session.user) {
    console.error("Authentication failed for article creation.");
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 }
    );
  }

  const userRole = normalizeAdminRole(session.user.role);

  if (!userRole || ![ADMIN_ROLE, SUPER_ADMIN_ROLE].includes(userRole)) {
    console.error(
      "Insufficient role attempting to create an article:",
      userRole
    );
    return NextResponse.json(
      { message: "You do not have permission to create articles." },
      { status: 403 }
    );
  }

  // 2. Parse Request Body
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error("Failed to parse request body:", error);
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  const {
    title,
    slug,
    content,
    categories, // Assuming this is an array of category IDs (strings)
    isBreakingNews,
    isTopRated,
    featuredImageUrl,
    author, // This might be automatically determined from session.user.id
  } = requestBody;

  // 3. Basic Data Validation
  if (!title || !content || !author) {
    console.error(
      "Validation failed: Missing required fields (title, content, author)."
    );
    return NextResponse.json(
      { message: "Title, content, and author are required." },
      { status: 400 }
    );
  }

  // Generate slug if not provided or empty
  const generatedSlug = slug
    ? slug
    : title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");

  if (!generatedSlug) {
    console.error("Validation failed: Could not generate a valid slug.");
    return NextResponse.json(
      { message: "Could not generate a valid slug." },
      { status: 400 }
    );
  }

  // 4. Check if Slug Already Exists (Optional but recommended)
  const existingArticle = await db.article.findUnique({
    where: { slug: generatedSlug },
    select: { id: true }, // Only need to know if it exists
  });

  if (existingArticle) {
    console.error(`Validation failed: Slug "${generatedSlug}" already exists.`);
    // You might want to return a more specific error or try generating a unique slug variation
    return NextResponse.json(
      { message: `Article with slug "${generatedSlug}" already exists.` },
      { status: 409 }
    ); // 409 Conflict
  }

  // 5. Prepare Category Relations
  // Ensure categories is an array of strings (IDs)
  const categoryIds = Array.isArray(categories) ? categories : [];

  // Filter out invalid category IDs if necessary, or create new ones if allowed
  // For simplicity, we assume the IDs provided are valid existing Category IDs.
  // A more robust approach would query the Category table first.

  // 6. Create Article in Database
  console.log("Creating article with slug:", session.user.id, generatedSlug);
  try {
    
    const newArticle = await db.article.create({
      data: {
        title,
        slug: generatedSlug,
        content,
        status: ArticleStatus.DRAFT, // Default status
        isBreakingNews: !!isBreakingNews,
        isTopRated: !!isTopRated,
        featuredImageUrl: featuredImageUrl || undefined,
        authorId: session.user.id, // Use the logged-in user's ID
        categoryId: categoryIds.length > 0 ? categoryIds[0] : undefined,

      },
    })

    console.log("Article created successfully:", newArticle);

    // Respond with success message and the created article data
    return NextResponse.json(newArticle, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Error creating article in database:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        if (prismaErrorTargetsInclude(error.meta?.target, "slug")) {
          return NextResponse.json(
            { message: `Article slug "${generatedSlug}" already exists.` },
            { status: 409 }
          );
        }
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Invalid author or category reference." },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { message: "Failed to create article." },
      { status: 500 }
    );
  }
}

// --- Add GET handler if you want to fetch articles via API too ---
/*
export async function GET() {
  // Add logic here to fetch articles from the database
  try {
    const articles = await db.article.findMany({
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ message: 'Failed to fetch articles.' }, { status: 500 });
  }
}
*/

// --- Placeholder for Pages Router ---
/*
// pages/api/articles.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { authOptions, getAuthSession } from '@/lib/auth'; // Adjust path
import { db } from '@/lib/db'; // Adjust path
import { ArticleStatus, AdminRole } from '@prisma/client';
import { nanoid } from 'nanoid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const session = await getAuthSession(req, res); // Pass req, res for NextApiRequest compatibility if needed

    if (!session || !session.user || (session.user.role !== AdminRole.EDITOR && session.user.role !== AdminRole.SUPER_ADMIN)) {
      return res.status(401).json({ message: 'Authentication required or insufficient permissions.' });
    }

    const {
      title,
      slug,
      content,
      categories,
      isBreakingNews,
      isTopRated,
      featuredImageUrl,
      author,
    } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ message: 'Title, content, and author are required.' });
    }

    const generatedSlug = slug
      ? slug
      : title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
          .replace(/--+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');

     if (!generatedSlug) {
      return res.status(400).json({ message: 'Could not generate a valid slug.' });
    }


    try {
       const existingArticle = await db.article.findUnique({ where: { slug: generatedSlug } });
        if (existingArticle) {
            return res.status(409).json({ message: `Article with slug "${generatedSlug}" already exists.` });
        }


      const categoryIds = Array.isArray(categories) ? categories : [];

      const newArticle = await db.article.create({
        data: {
          title,
          slug: generatedSlug,
          content,
          status: ArticleStatus.DRAFT,
          isBreakingNews: !!isBreakingNews,
          isTopRated: !!isTopRated,
          featuredImageUrl: featuredImageUrl || undefined,
          authorId: session.user.id,
          categoryId: categoryIds.length > 0 ? categoryIds[0] : undefined,
        },
        include: {
          author: { select: { name: true, email: true } },
          category: { select: { name: true } },
        }
      });

      console.log("Article created successfully:", newArticle);
      return res.status(201).json(newArticle);

    } catch (error: any) {
      console.error("Error creating article:", error);
       if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
           return res.status(409).json({ message: `Article slug "${generatedSlug}" already exists.` });
        }
        if (error.code === 'P2025') {
           return res.status(400).json({ message: 'Invalid author or category reference.' });
        }
      return res.status(500).json({ message: 'Failed to create article.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
*/
