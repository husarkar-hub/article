// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// PUT - Change user password
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        message: "Current password and new password are required"
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({
        message: "New password must be at least 6 characters long"
      }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        hashedPassword: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isValidPassword) {
      return NextResponse.json({
        message: "Current password is incorrect"
      }, { status: 400 });
    }

    // Hash new password
    const salt = bcrypt.genSaltSync(12);
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt);

    // Update password in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hashedPassword: hashedNewPassword,
      },
    });

    return NextResponse.json({
      message: "Password updated successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Error changing password:", error);
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