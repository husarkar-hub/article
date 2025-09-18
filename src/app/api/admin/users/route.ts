// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { getAuthSession } from '@/lib/auth';
import {db as prisma} from '@/lib/db';
import {
  STAFF_ROLES,
  isSuperAdmin,
  normalizeAdminRole,
} from '@/lib/roles';
import { prismaErrorTargetsInclude } from '@/lib/prisma';






export async function POST(req: Request) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  if (!isSuperAdmin(normalizeAdminRole(session.user.role))) {
    return NextResponse.json(
      { message: 'Only Super Admins can manage admin users.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { username, email, password, role } = body as {
      username?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    // --- Input Validation ---
    if (!username || !email || !password || !role) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const desiredRole = normalizeAdminRole(role);
    if (!desiredRole) {
      return NextResponse.json({ message: 'Invalid role provided.', validRoles: STAFF_ROLES }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
        ],
      },
    });

    if (existingUser) {
      let message = '';

      if (existingUser.email === email) message += 'Email ';
      return NextResponse.json({ message: `${message}already exists.` }, { status: 409 });
    }

    // --- Hash Password ---
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // --- Create New User ---
    const newUser = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        role: desiredRole,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    const formattedUser = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };

    return NextResponse.json(formattedUser, { status: 201 });
  } catch (error) {
    console.error('Error adding admin user:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        if (prismaErrorTargetsInclude(error.meta?.target, 'email')) {
          return NextResponse.json({ message: 'Email already in use.' }, { status: 409 });
        }
        if (prismaErrorTargetsInclude(error.meta?.target, 'username')) {
          return NextResponse.json({ message: 'Username already in use.' }, { status: 409 });
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

  if (!isSuperAdmin(normalizeAdminRole(session.user.role))) {
    return NextResponse.json(
      { message: 'Only Super Admins can view admin users.' },
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
      }
    });

    const formattedUser = users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: 'ACTIVE',
    }));

    return NextResponse.json(formattedUser, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Failed to fetch admin users', error: message },
      { status: 500 }
    );
  }
}

// Block other methods
export async function PUT() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }