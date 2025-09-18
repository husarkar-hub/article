// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import {db as prisma} from '@/lib/db'; 
import bcrypt from 'bcryptjs'; 






export async function POST(req: Request) {
 

  try {
    const body = await req.json();
    const { username, email, password, role } = body;

    // --- Input Validation ---
    if (!username || !email || !password || !role) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }
    const validRoles = ['Super Admin', 'Editor', 'Viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: 'Invalid role provided.', validRoles }, { status: 400 });
    }
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          
          { email: email },
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
        role, 
      },
      // Select only the fields you want to return to the client
      select: {
        id: true,
     
        email: true,
        role: true,
        createdAt: true,
      }
    });

    // Format for frontend AdminUser interface
    const formattedUser = {
      id: newUser.id,
     
      email: newUser.email,
      role: newUser.role, // Ensure role matches frontend enum 'Super Admin', 'Editor', 'Viewer'
     
    };

    return NextResponse.json(formattedUser, { status: 201 });

  } catch (error: any) {
    console.error('Error adding admin user:', error);
    // P2002 is for unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return NextResponse.json({ message: 'Email already in use.' }, { status: 409 });
    }
     if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
        return NextResponse.json({ message: 'Username already in use.' }, { status: 409 });
    }
    return NextResponse.json(
      { message: 'Failed to add admin', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
 

  try {
    const users = await prisma.user.findMany({
      where: {
        // Optionally filter out the current logged-in user or specific roles if needed
        // id: { not: getCurrentUserId(req) }, // Exclude current user if necessary
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
       
        email: true,
        role: true,
  // Assuming status is part of User model
        createdAt: true,
      }
    });

    // Format for frontend AdminUser interface
    const formattedUser = users.map((user: any) => ({
      id: user.id,
     
      email: user.email,
      role: user.role, // Ensure roles match frontend enum 'Super Admin', 'Editor', 'Viewer'
      status: user.status || 'Active', // Default status if not set by schema/API
    }));

    return NextResponse.json({ status: 200 });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch admin users', error: error.message },
      { status: 500 }
    );
  }
}

// Block other methods
export async function PUT() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ message: 'Method not allowed' }, { status: 405 }); }