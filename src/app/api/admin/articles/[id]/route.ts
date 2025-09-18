import { NextResponse } from "next/server";
import { Prisma, ArticleStatus } from "@prisma/client";

import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  EDITOR_ROLE,
  SUPER_ADMIN_ROLE,
  isStaff,
  normalizeAdminRole,
} from "@/lib/roles";
import { prismaErrorTargetsInclude } from "@/lib/prisma";

const RESTRICTED_EDITOR_STATUSES: ArticleStatus[] = [
  ArticleStatus.PUBLISHED,
  ArticleStatus.ARCHIVED,
];

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function resolveCategoryId(body: Record<string, unknown>): string | undefined {
  const { categoryId, categories } = body;

  if (typeof categoryId === "string" && categoryId.trim()) {
    return categoryId;
  }

  if (Array.isArray(categories) && categories.length > 0) {
    const [firstCategory] = categories;
    if (typeof firstCategory === "string" && firstCategory.trim()) {
      return firstCategory;
    }
  }

  return undefined;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 }
    );
  }

  const role = normalizeAdminRole(session.user.role);

  if (!role || !isStaff(role)) {
    return NextResponse.json(
      { message: "You do not have permission to edit articles." },
      { status: 403 }
    );
  }

  const articleId = params?.id;

  if (!articleId) {
    return NextResponse.json(
      { message: "Article identifier is required." },
      { status: 400 }
    );
  }

  const existingArticle = await db.article.findUnique({
    where: { id: articleId },
    select: { status: true, slug: true },
  });

  if (!existingArticle) {
    return NextResponse.json(
      { message: "Article not found." },
      { status: 404 }
    );
  }

  if (
    role === EDITOR_ROLE &&
    RESTRICTED_EDITOR_STATUSES.includes(existingArticle.status)
  ) {
    return NextResponse.json(
      {
        message:
          "Editors cannot modify articles while they are published or archived.",
      },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("Invalid request body for article update:", error);
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  const payload = body as Record<string, unknown>;

  let requestedStatus: ArticleStatus | undefined;

  if (Object.prototype.hasOwnProperty.call(payload, "status")) {
    if (role !== SUPER_ADMIN_ROLE) {
      return NextResponse.json(
        { message: "Only Super Admins can change article status." },
        { status: 403 }
      );
    }

    const rawStatus = payload.status;
    if (typeof rawStatus !== "string") {
      return NextResponse.json(
        { message: "Invalid status value provided." },
        { status: 400 }
      );
    }

    const normalizedStatus = rawStatus
      .toUpperCase()
      .replace(/[\s-]+/g, "_") as ArticleStatus;

    if (!Object.values(ArticleStatus).includes(normalizedStatus)) {
      return NextResponse.json(
        { message: "Invalid status value provided." },
        { status: 400 }
      );
    }

    requestedStatus = normalizedStatus;
  }

  const updateData: Record<string, unknown> = {};

  if (typeof payload.title === "string") {
    updateData.title = payload.title;
  }

  if (typeof payload.content === "string") {
    updateData.content = payload.content;
  }

  if (typeof payload.isBreakingNews === "boolean") {
    updateData.isBreakingNews = payload.isBreakingNews;
  }

  if (typeof payload.isTopRated === "boolean") {
    updateData.isTopRated = payload.isTopRated;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "featuredImageUrl")) {
    const featuredImage = payload.featuredImageUrl;
    if (featuredImage === null || typeof featuredImage === "string") {
      updateData.featuredImageUrl = featuredImage || null;
    } else {
      return NextResponse.json(
        { message: "Invalid featured image value provided." },
        { status: 400 }
      );
    }
  }

  if (typeof payload.slug === "string") {
    const normalizedSlug = normalizeSlug(payload.slug);

    if (!normalizedSlug) {
      return NextResponse.json(
        { message: "Provided slug is not valid." },
        { status: 400 }
      );
    }

    updateData.slug = normalizedSlug;
  }

  const resolvedCategoryId = resolveCategoryId(payload);
  if (
    Object.prototype.hasOwnProperty.call(payload, "categoryId") ||
    Object.prototype.hasOwnProperty.call(payload, "categories")
  ) {
    updateData.categoryId = resolvedCategoryId ?? null;
  }

  if (requestedStatus) {
    updateData.status = requestedStatus;
    updateData.publishedAt =
      requestedStatus === ArticleStatus.PUBLISHED ? new Date() : null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "authorId")) {
    if (role !== SUPER_ADMIN_ROLE) {
      return NextResponse.json(
        { message: "Only Super Admins can reassign article authors." },
        { status: 403 }
      );
    }

    if (typeof payload.authorId === "string" && payload.authorId.trim()) {
      updateData.authorId = payload.authorId;
    } else {
      return NextResponse.json(
        { message: "Invalid author identifier provided." },
        { status: 400 }
      );
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { message: "No valid fields provided for update." },
      { status: 400 }
    );
  }

  if (
    typeof updateData.slug === "string" &&
    updateData.slug !== existingArticle.slug
  ) {
    const conflictingArticle = await db.article.findUnique({
      where: { slug: updateData.slug as string },
      select: { id: true },
    });

    if (conflictingArticle && conflictingArticle.id !== articleId) {
      return NextResponse.json(
        { message: "Another article already uses the provided slug." },
        { status: 409 }
      );
    }
  }

  try {
    const updatedArticle = await db.article.update({
      where: { id: articleId },
      data: updateData,
    });

    return NextResponse.json(updatedArticle, { status: 200 });
  } catch (error) {
    console.error(`Error updating article ${articleId}:`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Article not found." },
          { status: 404 }
        );
      }

      if (error.code === "P2002") {
        if (prismaErrorTargetsInclude(error.meta?.target, "slug")) {
          return NextResponse.json(
            { message: "Provided slug is already in use." },
            { status: 409 }
          );
        }
      }
    }

    return NextResponse.json(
      { message: "Failed to update article." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function POST() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}
