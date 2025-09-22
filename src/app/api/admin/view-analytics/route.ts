// app/api/admin/view-analytics/route.ts - Admin View Analytics API

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { viewTracker, ViewTrackingService } from '@/lib/view-tracking';
import { db } from '@/lib/db';

// Type guard to check if user is admin
function isAdmin(role: string | undefined): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

// GET - Fetch view analytics and suspicious activity
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { message: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const articleSlug = searchParams.get('slug');

    if (articleSlug) {
      // Get detailed analytics for specific article
      const [viewStats, suspiciousActivity] = await Promise.all([
        viewTracker.getViewStats(articleSlug),
        viewTracker.detectSuspiciousActivity(articleSlug)
      ]);

      return NextResponse.json({
        articleSlug,
        viewStats,
        suspiciousActivity,
        timestamp: new Date().toISOString()
      });
    } else {
      // Get system-wide analytics
      const systemStats = await getSystemWideAnalytics();
      return NextResponse.json({
        systemStats,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error fetching view analytics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Perform admin actions (reset counts, bulk operations)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { message: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, articleSlug, newCount } = body;

    switch (action) {
      case 'reset_view_count':
        if (!articleSlug) {
          return NextResponse.json(
            { message: 'Article slug is required' },
            { status: 400 }
          );
        }
        
        const resetSuccess = await viewTracker.resetViewCount(
          articleSlug, 
          newCount || 0
        );
        
        return NextResponse.json({
          success: resetSuccess,
          message: resetSuccess 
            ? `View count reset for ${articleSlug}` 
            : 'Failed to reset view count'
        });

      case 'bulk_fix_view_counts':
        const bulkResult = await viewTracker.bulkUpdateViewCounts();
        return NextResponse.json({
          success: true,
          updated: bulkResult.updated,
          errors: bulkResult.errors,
          message: `Updated ${bulkResult.updated} articles, ${bulkResult.errors} errors`
        });

      case 'get_suspicious_activity':
        const timeRange = body.timeRange || '24h';
        const suspicious = await getSuspiciousActivityReport(timeRange);
        return NextResponse.json({
          suspicious,
          timeRange,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { message: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error performing admin action:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get system-wide analytics
async function getSystemWideAnalytics() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get basic stats
    const [
      totalViewCounts,
      visitsToday,
      visitsThisWeek,
      topArticlesByViews,
      problematicArticles
    ] = await Promise.all([
      // Total view counts across all articles
      db.article.aggregate({
        _sum: { views: true },
        _count: { views: true },
        _avg: { views: true },
        _max: { views: true }
      }),

      // Visits today
      db.articleVisitLog.count({
        where: { visitTimestamp: { gte: oneDayAgo } }
      }),

      // Visits this week
      db.articleVisitLog.count({
        where: { visitTimestamp: { gte: oneWeekAgo } }
      }),

      // Top articles by view count
      db.article.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { views: 'desc' },
        take: 10,
        select: {
          slug: true,
          title: true,
          views: true,
          publishedAt: true
        }
      }),

      // Articles with potential issues
      db.article.findMany({
        where: {
          OR: [
            { views: { gte: 1000000 } }, // Suspiciously high
            { views: { lt: 0 } }, // Negative views
          ]
        },
        select: {
          slug: true,
          title: true,
          views: true,
          createdAt: true
        }
      })
    ]);

    // Get unique visitors today and this week
    const [uniqueVisitorsToday, uniqueVisitorsThisWeek] = await Promise.all([
      db.articleVisitLog.findMany({
        where: { visitTimestamp: { gte: oneDayAgo } },
        select: { ipAddress: true },
        distinct: ['ipAddress']
      }),
      db.articleVisitLog.findMany({
        where: { visitTimestamp: { gte: oneWeekAgo } },
        select: { ipAddress: true },
        distinct: ['ipAddress']
      })
    ]);

    return {
      totalViews: totalViewCounts._sum.views || 0,
      averageViews: Math.round(totalViewCounts._avg.views || 0),
      maxViews: totalViewCounts._max.views || 0,
      totalArticles: totalViewCounts._count.views,
      visitsToday,
      visitsThisWeek,
      uniqueVisitorsToday: uniqueVisitorsToday.length,
      uniqueVisitorsThisWeek: uniqueVisitorsThisWeek.length,
      topArticlesByViews,
      problematicArticles: problematicArticles.length > 0 ? problematicArticles : null
    };

  } catch (error) {
    console.error('Error getting system-wide analytics:', error);
    return null;
  }
}

// Helper function to get suspicious activity report
async function getSuspiciousActivityReport(timeRange: string) {
  try {
    let startDate: Date;
    
    switch (timeRange) {
      case '1h':
        startDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Find IPs with excessive requests
    const suspiciousIps = await db.articleVisitLog.groupBy({
      by: ['ipAddress', 'articleSlug'],
      where: { visitTimestamp: { gte: startDate } },
      _count: { ipAddress: true },
      having: { ipAddress: { _count: { gt: 20 } } }, // More than 20 views
      orderBy: { _count: { ipAddress: 'desc' } },
      take: 50
    });

    // Find potential bot traffic
    const botPatterns = ['bot', 'crawl', 'spider', 'scrape'];
    const botTraffic = await db.articleVisitLog.findMany({
      where: {
        visitTimestamp: { gte: startDate },
        OR: botPatterns.map(pattern => ({
          userAgent: { contains: pattern, mode: 'insensitive' }
        }))
      },
      select: {
        ipAddress: true,
        articleSlug: true,
        userAgent: true,
        visitTimestamp: true
      },
      take: 100
    });

    return {
      suspiciousIps: suspiciousIps.map(ip => ({
        ipAddress: ip.ipAddress,
        articleSlug: ip.articleSlug,
        requestCount: ip._count.ipAddress,
        severity: ip._count.ipAddress > 50 ? 'HIGH' : 'MEDIUM'
      })),
      botTraffic: botTraffic.map(bot => ({
        ipAddress: bot.ipAddress,
        articleSlug: bot.articleSlug,
        userAgent: bot.userAgent?.substring(0, 100),
        timestamp: bot.visitTimestamp
      })),
      summary: {
        totalSuspiciousIps: suspiciousIps.length,
        totalBotRequests: botTraffic.length,
        timeRange
      }
    };

  } catch (error) {
    console.error('Error getting suspicious activity report:', error);
    return null;
  }
}