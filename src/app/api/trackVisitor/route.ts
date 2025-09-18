// app/api/track-visit/route.ts

import { NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';
import { db as prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { articleSlug, referrer } = body;

   
    const userAgentString = req.headers.get('user-agent') || '';
    const parser = new UAParser(userAgentString);
    const userAgentInfo = parser.getResult();

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] || 
      req.headers.get('remote_addr') || 
      'Unknown';
   
    await prisma.articleVisitLog.create({
      data: {
        articleSlug: articleSlug || 'unknown', 
        userAgent: userAgentString,
        browser: userAgentInfo.browser.name || 'Unknown',
        os: userAgentInfo.os.name || 'Unknown',
        ipAddress: ipAddress,
        referrer: referrer || 'Direct',
     
       
      },
    });

    return NextResponse.json({ message: 'Visit tracked successfully' }, { status: 201 });

  } catch (error) {
    console.error('Error tracking visit:', error);

    console.error('Request Body:', await req.text()); 
    return NextResponse.json(
      { message: 'Failed to track visit', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Optional: Catch-all for other methods if needed
export async function GET() {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}