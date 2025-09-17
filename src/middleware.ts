import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
   
  });

  const { pathname } = request.nextUrl;


  const protectedPaths = ['/admin']; 

  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected && !token) {

    const signInUrl = new URL('/', request.url);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}


export const config = {
  
  matcher: [
    '/admin/:path*',      
    
  ],
};