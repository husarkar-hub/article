// lib/view-tracking.ts - View Count Integrity Service

import { db } from '@/lib/db';

export interface ViewTrackingConfig {
  maxViewsPerIpPerHour: number;
  viewCooldownPeriod: number; // in milliseconds
  maxSafeViewCount: number;
  botUserAgents: RegExp[];
  enableRateLimiting: boolean;
  enableBotDetection: boolean;
}

export const DEFAULT_VIEW_CONFIG: ViewTrackingConfig = {
  maxViewsPerIpPerHour: 10,
  viewCooldownPeriod: 5 * 60 * 1000, // 5 minutes
  maxSafeViewCount: Number.MAX_SAFE_INTEGER,
  botUserAgents: [
    /\bbot\b/i,
    /\bcrawler\b/i,
    /\bspider\b/i,
    /\bscraper\b/i,
    /\bmediapartners\b/i,
    /\bgooglebot\b/i,
    /\bbingbot\b/i,
    /\byahoo.*\bslurp\b/i,
    /\bduckduckbot\b/i,
    /\bbaiduspider\b/i,
    /\byandexbot\b/i,
    /\bfacebookexternalhit\b/i,
    /\btwitterbot\b/i,
    /\blinkedinbot\b/i,
    /\bpinterestbot\b/i,
    /\bredditbot\b/i,
    /\btelegrambot\b/i,
    /\bslackbot\b/i,
    /\bwhatsapp\b/i,
    /\bcurl\//i,
    /\bwget\b/i,
    /\bpython-requests\b/i,
    /\bpostman\b/i,
    /\binsomnia\b/i,
    /\bhttpie\b/i,
    /\bheadless\b/i,
    /\bphantomjs\b/i,
    /\bselenium\b/i,
    /\bwebdriver\b/i,
    /\bpuppeteer\b/i,
    /\bplaywright\b/i,
    /\bchrome-lighthouse\b/i,
    /\btest\s*agent\b/i
  ],
  enableRateLimiting: true,
  enableBotDetection: true,
};

export interface ViewCountStats {
  totalViews: number;
  uniqueIpsToday: number;
  uniqueIpsThisWeek: number;
  averageViewsPerDay: number;
  topReferrers: Array<{ referrer: string; count: number }>;
  hourlyDistribution: Array<{ hour: number; views: number }>;
}

export interface SuspiciousActivity {
  type: 'RATE_LIMIT_EXCEEDED' | 'BOT_DETECTED' | 'UNUSUAL_PATTERN';
  details: string;
  ipAddress: string;
  timestamp: Date;
  articleSlug: string;
}

export class ViewTrackingService {
  private config: ViewTrackingConfig;

  constructor(config: Partial<ViewTrackingConfig> = {}) {
    this.config = { ...DEFAULT_VIEW_CONFIG, ...config };
  }

  /**
   * Detect if the request is from a bot
   */
  public isBotTraffic(userAgent: string): boolean {
    if (!this.config.enableBotDetection) return false;
    
    return this.config.botUserAgents.some(pattern => pattern.test(userAgent));
  }

  /**
   * Check if IP has exceeded rate limits
   */
  public async checkRateLimit(articleSlug: string, ipAddress: string): Promise<boolean> {
    if (!this.config.enableRateLimiting) return false;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    try {
      const recentViews = await db.articleVisitLog.count({
        where: {
          articleSlug: articleSlug,
          ipAddress: ipAddress,
          visitTimestamp: { gte: oneHourAgo }
        }
      });

      return recentViews >= this.config.maxViewsPerIpPerHour;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return true; // Fail safe - block on error
    }
  }

  /**
   * Check if IP is in cooldown period
   */
  public async isInCooldownPeriod(articleSlug: string, ipAddress: string): Promise<boolean> {
    const cooldownStart = new Date(Date.now() - this.config.viewCooldownPeriod);
    
    try {
      const recentView = await db.articleVisitLog.findFirst({
        where: {
          articleSlug: articleSlug,
          ipAddress: ipAddress,
          visitTimestamp: { gte: cooldownStart }
        },
        orderBy: { visitTimestamp: 'desc' }
      });

      return !!recentView;
    } catch (error) {
      console.error('Error checking cooldown period:', error);
      return true; // Fail safe - block on error
    }
  }

  /**
   * Safely increment view count with all validations
   */
  public async incrementViewCount(
    articleSlug: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<{ success: boolean; newCount?: number; reason?: string }> {
    
    try {
      // Bot detection
      if (this.isBotTraffic(userAgent)) {
        return { success: false, reason: 'Bot traffic detected' };
      }

      // Rate limiting
      if (await this.checkRateLimit(articleSlug, ipAddress)) {
        return { success: false, reason: 'Rate limit exceeded' };
      }

      // Cooldown period
      if (await this.isInCooldownPeriod(articleSlug, ipAddress)) {
        return { success: false, reason: 'Cooldown period active' };
      }

      // Perform safe increment with transaction
      const result = await db.$transaction(async (tx) => {
        const article = await tx.article.findUnique({
          where: { slug: articleSlug, status: 'PUBLISHED' },
          select: { id: true, views: true }
        });

        if (!article) {
          throw new Error('Article not found');
        }

        // Overflow protection
        if (article.views >= this.config.maxSafeViewCount - 1) {
          throw new Error('View count at maximum safe limit');
        }

        // Ensure non-negative view count
        const currentViews = Math.max(0, article.views || 0);

        const updatedArticle = await tx.article.update({
          where: { slug: articleSlug },
          data: { views: currentViews + 1 },
          select: { views: true }
        });

        return updatedArticle.views;
      });

      return { success: true, newCount: result };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error incrementing view count:', error);
      return { success: false, reason: errorMessage };
    }
  }

  /**
   * Get comprehensive view statistics for an article
   */
  public async getViewStats(articleSlug: string): Promise<ViewCountStats | null> {
    try {
      const article = await db.article.findUnique({
        where: { slug: articleSlug },
        select: { views: true, createdAt: true }
      });

      if (!article) return null;

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get unique IPs for today and this week
      const [uniqueIpsToday, uniqueIpsThisWeek] = await Promise.all([
        db.articleVisitLog.findMany({
          where: { 
            articleSlug: articleSlug, 
            visitTimestamp: { gte: oneDayAgo } 
          },
          select: { ipAddress: true },
          distinct: ['ipAddress']
        }),
        db.articleVisitLog.findMany({
          where: { 
            articleSlug: articleSlug, 
            visitTimestamp: { gte: oneWeekAgo } 
          },
          select: { ipAddress: true },
          distinct: ['ipAddress']
        })
      ]);

      // Calculate average views per day since creation
      const daysSinceCreation = Math.max(1, 
        Math.floor((Date.now() - article.createdAt.getTime()) / (24 * 60 * 60 * 1000))
      );
      const averageViewsPerDay = Math.round(article.views / daysSinceCreation);

      // Get top referrers
      const referrerStats = await db.articleVisitLog.groupBy({
        by: ['referrer'],
        where: { 
          articleSlug: articleSlug,
          visitTimestamp: { gte: oneWeekAgo }
        },
        _count: { referrer: true },
        orderBy: { _count: { referrer: 'desc' } },
        take: 5
      });

      const topReferrers = referrerStats.map(stat => ({
        referrer: stat.referrer || 'Direct',
        count: stat._count.referrer
      }));

      // Get hourly distribution (last 24 hours)
      const hourlyStats = await db.articleVisitLog.findMany({
        where: { 
          articleSlug: articleSlug,
          visitTimestamp: { gte: oneDayAgo }
        },
        select: { visitTimestamp: true }
      });

      const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        views: hourlyStats.filter(stat => 
          stat.visitTimestamp.getHours() === hour
        ).length
      }));

      return {
        totalViews: article.views,
        uniqueIpsToday: uniqueIpsToday.length,
        uniqueIpsThisWeek: uniqueIpsThisWeek.length,
        averageViewsPerDay,
        topReferrers,
        hourlyDistribution
      };

    } catch (error) {
      console.error('Error getting view stats:', error);
      return null;
    }
  }

  /**
   * Detect suspicious viewing patterns
   */
  public async detectSuspiciousActivity(articleSlug: string): Promise<SuspiciousActivity[]> {
    const suspicious: SuspiciousActivity[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    try {
      // Find IPs with excessive views
      const suspiciousIps = await db.articleVisitLog.groupBy({
        by: ['ipAddress'],
        where: {
          articleSlug: articleSlug,
          visitTimestamp: { gte: oneHourAgo }
        },
        _count: { ipAddress: true },
        having: {
          ipAddress: { _count: { gt: this.config.maxViewsPerIpPerHour } }
        }
      });

      for (const ipStat of suspiciousIps) {
        suspicious.push({
          type: 'RATE_LIMIT_EXCEEDED',
          details: `${ipStat._count.ipAddress} views in last hour`,
          ipAddress: ipStat.ipAddress || 'Unknown',
          timestamp: new Date(),
          articleSlug: articleSlug
        });
      }

      // Find bot traffic
      const botVisits = await db.articleVisitLog.findMany({
        where: {
          articleSlug: articleSlug,
          visitTimestamp: { gte: oneHourAgo },
          OR: this.config.botUserAgents.map(pattern => ({
            userAgent: { contains: pattern.source.replace(/[\/\\]/g, '') }
          }))
        },
        select: { ipAddress: true, userAgent: true, visitTimestamp: true }
      });

      for (const botVisit of botVisits) {
        suspicious.push({
          type: 'BOT_DETECTED',
          details: `Bot user agent: ${botVisit.userAgent?.substring(0, 50)}...`,
          ipAddress: botVisit.ipAddress || 'Unknown',
          timestamp: botVisit.visitTimestamp,
          articleSlug: articleSlug
        });
      }

      return suspicious;

    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return [];
    }
  }

  /**
   * Reset view count for an article (admin function)
   */
  public async resetViewCount(articleSlug: string, newCount = 0): Promise<boolean> {
    try {
      await db.article.update({
        where: { slug: articleSlug },
        data: { views: Math.max(0, newCount) }
      });
      
      console.log(`View count reset for article ${articleSlug} to ${newCount}`);
      return true;
    } catch (error) {
      console.error('Error resetting view count:', error);
      return false;
    }
  }

  /**
   * Bulk update view counts (for data migration/cleanup)
   */
  public async bulkUpdateViewCounts(): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;

    try {
      // Find articles with negative view counts
      const problematicArticles = await db.article.findMany({
        where: {
          views: { lt: 0 }
        },
        select: { id: true, slug: true, views: true }
      });

      for (const article of problematicArticles) {
        try {
          await db.article.update({
            where: { id: article.id },
            data: { views: 0 }
          });
          updated++;
          console.log(`Fixed view count for article ${article.slug}`);
        } catch (error) {
          errors++;
          console.error(`Error fixing article ${article.slug}:`, error);
        }
      }

      return { updated, errors };
    } catch (error) {
      console.error('Error in bulk update:', error);
      return { updated: 0, errors: 1 };
    }
  }
}

// Export singleton instance
export const viewTracker = new ViewTrackingService();

// Export utility functions
export const ViewTrackingUtils = {
  /**
   * Check if a number is within safe integer limits
   */
  isSafeInteger: (num: number): boolean => {
    return Number.isSafeInteger(num) && num >= 0;
  },

  /**
   * Sanitize view count to prevent negative or unsafe values
   */
  sanitizeViewCount: (count: number): number => {
    if (typeof count !== 'number' || isNaN(count)) return 0;
    if (count < 0) return 0;
    if (!Number.isSafeInteger(count)) return Number.MAX_SAFE_INTEGER;
    return Math.floor(count);
  },

  /**
   * Format view count for display (e.g., 1.2K, 5.3M)
   */
  formatViewCount: (count: number): string => {
    const sanitized = ViewTrackingUtils.sanitizeViewCount(count);
    
    if (sanitized >= 1000000) {
      return (sanitized / 1000000).toFixed(1) + 'M';
    } else if (sanitized >= 1000) {
      return (sanitized / 1000).toFixed(1) + 'K';
    } else {
      return sanitized.toString();
    }
  },

  /**
   * Calculate reading time based on content length
   */
  calculateReadingTime: (content: string, wordsPerMinute = 200): number => {
    const textContent = content.replace(/<[^>]*>/g, ''); // Remove HTML
    const wordCount = textContent.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }
};