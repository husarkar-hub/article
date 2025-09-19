// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { Prisma, AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { getAuthSession } from '@/lib/auth';
import {db as prisma} from '@/lib/db';

// Define role constants to match the schema
const VALID_ROLES: AdminRole[] = ['SUPER_ADMIN', 'EDITOR'];

export async function POST(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  // Only Super Admin can create users
  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { message: 'Only Super Administrators can create new users.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { email, password, role } = body as {
      email?: string;
      password?: string;
      role?: AdminRole;
    };

    // --- Input Validation ---
    if (!email || !password || !role) {
      return NextResponse.json({ message: 'Email, password, and role are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ message: 'Invalid role provided.', validRoles: VALID_ROLES }, { status: 400 });
    }

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email already exists.' }, { status: 409 });
    }

    // --- Hash Password ---
    const salt = bcrypt.genSaltSync(12);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // --- Create New User ---
    const newUser = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Format response to match frontend interface
    const formattedUser = {
      id: newUser.id,
      username: newUser.email.split('@')[0], // Use email prefix as username
      email: newUser.email,
      role: newUser.role,
      status: 'ACTIVE' as const,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedUser, { status: 201 });
  } catch (error) {
    console.error('Error adding admin user:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        if (target?.includes('email')) {
          return NextResponse.json({ message: 'Email already in use.' }, { status: 409 });
        }
      }
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to add admin', error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  // Only admins can view user list
  if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { message: 'Only administrators can view user list.' },
      { status: 403 }
    );
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Format users to match frontend interface
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.email.split('@')[0], // Use email prefix as username
      email: user.email,
      role: user.role,
      status: 'ACTIVE' as const, // Default status since schema doesn't have status field
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedUsers, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to fetch admin users', error: message },
      { status: 500 }
    );
  }
}

// Block other methods at this level - individual user operations handled in [id] routes
export async function PUT() { 
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); 
}

export async function DELETE() { 
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); 
}