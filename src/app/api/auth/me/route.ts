// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db as prisma } from "@/lib/db";

// GET - Get current user information
export async function GET() {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Format response to match frontend interface
    const formattedUser = {
      id: user.id,
      username: user.email.split('@')[0], // Use email prefix as username
      email: user.email,
      role: user.role,
    };

    return NextResponse.json(formattedUser, { status: 200 });

  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Block other methods
export async function POST() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}