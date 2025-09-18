// app/api/admin/users/[id]/role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { AdminRole } from "@prisma/client";

// PUT - Update user role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only Super Admin can change roles
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({
        message: "Only Super Administrators can change user roles"
      }, { status: 403 });
    }

    const { id: userId } = await params;
    const { role } = await request.json();

    // Validate role
    const validRoles: AdminRole[] = ['SUPER_ADMIN', 'EDITOR'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        message: "Invalid role specified",
        validRoles
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({
        message: "User not found"
      }, { status: 404 });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Role updated successfully",
      user: updatedUser
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating user role:", error);
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

export async function DELETE() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}