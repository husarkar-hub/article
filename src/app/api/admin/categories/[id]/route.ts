import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE - Remove category (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete categories
    if (!['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({
        message: "Only administrators can delete categories"
      }, { status: 403 });
    }

    const { id: categoryId } = await params;

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json({
        message: "Category not found"
      }, { status: 404 });
    }

    // Check if category has articles
    if (existingCategory._count.articles > 0) {
      return NextResponse.json({
        message: `Cannot delete category. It has ${existingCategory._count.articles} article(s) associated with it. Please reassign or delete those articles first.`
      }, { status: 409 });
    }

    // Delete the category
    await db.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      message: "Category deleted successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Block other methods
export async function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function POST() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}