import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UAParser } from 'ua-parser-js';

// Configuration for view count integrity
const VIEW_COUNT_CONFIG = {
  // Maximum safe integer in JavaScript (2^53 - 1)
  MAX_SAFE_VIEW_COUNT: Number.MAX_SAFE_INTEGER,
  // Rate limiting: max views per IP per article per hour
  MAX_VIEWS_PER_IP_PER_HOUR: 10,
  // Cooldown period in milliseconds (5 minutes)
  VIEW_COOLDOWN_PERIOD: 5 * 60 * 1000,
  // Bot user agents patterns to block
  BOT_USER_AGENTS: [
    /bot/i, /crawl/i, /spider/i, /mediapartners/i, 
    /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
    /whatsapp/i, /telegrambot/i, /googlebot/i, /bingbot/i
  ],
};

// Interface for view validation result
interface ViewValidationResult {
  isValid: boolean;
  reason?: string;
  shouldTrack: boolean;
}

// Validate and sanitize view increment request
async function validateViewRequest(
  slug: string, 
  ipAddress: string, 
  userAgent: string
): Promise<ViewValidationResult> {
  
  // 1. Bot Detection
  const isBotTraffic = VIEW_COUNT_CONFIG.BOT_USER_AGENTS.some(
    pattern => pattern.test(userAgent)
  );
  
  if (isBotTraffic) {
    return {
      isValid: false,
      reason: 'Bot traffic detected',
      shouldTrack: false
    };
  }

  // 2. Rate Limiting Check
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  try {
    const recentViews = await db.articleVisitLog.count({
      where: {
        articleSlug: slug,
        ipAddress: ipAddress,
        visitTimestamp: {
          gte: oneHourAgo
        }
      }
    });

    if (recentViews >= VIEW_COUNT_CONFIG.MAX_VIEWS_PER_IP_PER_HOUR) {
      return {
        isValid: false,
        reason: 'Rate limit exceeded',
        shouldTrack: true // Still track for analytics but don't increment view count
      };
    }

    // 3. Cooldown Period Check (prevent rapid consecutive views)
    const recentView = await db.articleVisitLog.findFirst({
      where: {
        articleSlug: slug,
        ipAddress: ipAddress,
        visitTimestamp: {
          gte: new Date(Date.now() - VIEW_COUNT_CONFIG.VIEW_COOLDOWN_PERIOD)
        }
      },
      orderBy: {
        visitTimestamp: 'desc'
      }
    });

    if (recentView) {
      return {
        isValid: false,
        reason: 'Cooldown period active',
        shouldTrack: true
      };
    }

    return {
      isValid: true,
      shouldTrack: true
    };

  } catch (error) {
    console.error('Error validating view request:', error);
    // On error, be conservative and don't increment
    return {
      isValid: false,
      reason: 'Validation error',
      shouldTrack: true
    };
  }
}

// Safely increment view count with overflow protection
async function safeIncrementViewCount(slug: string): Promise<{ success: boolean; newViewCount?: number; error?: string }> {
  try {
    // Use transaction for atomic operations
    const result = await db.$transaction(async (tx) => {
      // Get current article with view count
      const article = await tx.article.findUnique({
        where: { slug, status: 'PUBLISHED' },
        select: { id: true, views: true }
      });

      if (!article) {
        throw new Error('Article not found');
      }

      // Check for overflow protection
      if (article.views >= VIEW_COUNT_CONFIG.MAX_SAFE_VIEW_COUNT - 1) {
        throw new Error('View count at maximum safe limit');
      }

      // Ensure views is not negative (data corruption protection)
      const currentViews = Math.max(0, article.views || 0);

      // Increment view count safely
      const updatedArticle = await tx.article.update({
        where: { slug },
        data: {
          views: currentViews + 1
        },
        select: { views: true }
      });

      return updatedArticle.views;
    });

    return { success: true, newViewCount: result };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in safeIncrementViewCount:', error);
    return { success: false, error: errorMessage };
  }
}

// POST - Increment view count with comprehensive validation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Extract request metadata
    const userAgentString = request.headers.get('user-agent') || 'Unknown';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] 
      || request.headers.get('x-real-ip') 
      || request.headers.get('remote_addr') 
      || 'Unknown';

    // Parse user agent for additional bot detection
    const parser = new UAParser(userAgentString);
    const userAgentInfo = parser.getResult();

    // Enhanced bot detection
    const enhancedUserAgent = `${userAgentInfo.browser.name || ''} ${userAgentInfo.os.name || ''} ${userAgentString}`;

    console.log(`View request for slug: ${slug} from IP: ${ipAddress.substring(0, 8)}...`);

    // Validate the view request
    const validation = await validateViewRequest(slug, ipAddress, enhancedUserAgent);

    // Always track visit for analytics (even if view count won't be incremented)
    if (validation.shouldTrack) {
      try {
        await db.articleVisitLog.create({
          data: {
            articleSlug: slug,
            userAgent: userAgentString,
            browser: userAgentInfo.browser.name || 'Unknown',
            os: userAgentInfo.os.name || 'Unknown',
            ipAddress: ipAddress,
            referrer: request.headers.get('referer') || 'Direct',
            visitTimestamp: new Date(),
            customData: {
              viewCountIncremented: validation.isValid,
              blockReason: validation.reason || null,
              browserVersion: userAgentInfo.browser.version || null,
              osVersion: userAgentInfo.os.version || null,
              deviceType: userAgentInfo.device.type || null
            } as any
          }
        });
      } catch (logError) {
        console.error('Error logging visit:', logError);
        // Continue processing even if logging fails
      }
    }

    // If validation failed, return appropriate response
    if (!validation.isValid) {
      return NextResponse.json({
        message: 'View tracked but not counted',
        reason: validation.reason,
        counted: false
      }, { status: 200 });
    }

    // Safely increment view count
    const incrementResult = await safeIncrementViewCount(slug);

    if (!incrementResult.success) {
      return NextResponse.json({
        message: 'Failed to increment view count',
        error: incrementResult.error,
        counted: false
      }, { status: 500 });
    }

    console.log(`View count safely incremented for slug: ${slug}, new count: ${incrementResult.newViewCount}`);

    return NextResponse.json({
      message: 'View count incremented successfully',
      views: incrementResult.newViewCount,
      counted: true
    }, { status: 200 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in view tracking endpoint:', error);
    
    return NextResponse.json({
      message: 'Internal server error',
      error: errorMessage,
      counted: false
    }, { status: 500 });
  }
}

// Block other methods
export async function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}