// app/admin/users/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Activity,
  Globe,
  Monitor,
  RefreshCcw,
  Search,
  Calendar,
  MapPin,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react";

// --- Interface for Visit Log Data ---
interface VisitLog {
  id: string;
  articleSlug: string;
  visitTimestamp: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  referrer?: string;
  visitedAt: string;
  customData?: any;
}

// --- Visit Statistics Component ---
const VisitStats = ({ logs }: { logs: VisitLog[] }) => {
  const totalVisits = logs.length;
  const uniqueIPs = new Set(logs.map((log) => log.ipAddress)).size;
  const uniqueSlugs = new Set(logs.map((log) => log.articleSlug)).size;

  const topBrowsers = logs.reduce((acc, log) => {
    const browser = log.browser || "Unknown";
    acc[browser] = (acc[browser] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Visits</p>
              <p className="text-2xl font-bold">{totalVisits}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unique IPs</p>
              <p className="text-2xl font-bold">{uniqueIPs}</p>
            </div>
            <Globe className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Articles Visited</p>
              <p className="text-2xl font-bold">{uniqueSlugs}</p>
            </div>
            <Eye className="w-8 h-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Top Browser</p>
              <p className="text-lg font-bold">
                {Object.entries(topBrowsers).sort(
                  ([, a], [, b]) => b - a
                )[0]?.[0] || "N/A"}
              </p>
            </div>
            <Monitor className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Main Visit Logs Page ---
const VisitLogsPage = () => {
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<VisitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize] = useState(20); // Records per page
  const [autoRefresh, setAutoRefresh] = useState(false); // Auto-refresh toggle
  const refreshIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false); // Fix hydration issues
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Intersection Observer for infinite scrolling
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  // Fix hydration by ensuring component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Define all functions first before useEffect hooks that use them
  const fetchLogs = React.useCallback(
    async (page: number = 1, reset: boolean = false) => {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/logs?page=${page}&limit=${pageSize}`
        );

        if (!response.ok) {
          toast.error("Failed to load visit logs", {
            description: `Server returned status ${response.status}`,
          });
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const { data, pagination } = result;

        if (reset) {
          setLogs(data);
        } else {
          setLogs((prev) => [...prev, ...data]);
        }

        setTotalPages(pagination.totalPages);
        setTotalRecords(pagination.total);
        setHasMore(pagination.hasMore);
        setCurrentPage(page);

        if (reset) {
          toast.success("Visit logs loaded successfully", {
            description: `Found ${pagination.total} total visit records`,
          });
          setLastRefresh(new Date());
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load visit logs";
        setError(errorMessage);
        console.error("Error fetching logs:", error);

        toast.error("Loading failed", {
          description: errorMessage,
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [pageSize]
  );

  const loadMore = React.useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchLogs(currentPage + 1, false);
    }
  }, [loadingMore, hasMore, currentPage, fetchLogs]);

  const refreshLogs = React.useCallback(() => {
    fetchLogs(1, true);
  }, [fetchLogs]);

  // Auto-refresh functionality
  const autoRefreshCallback = React.useCallback(() => {
    if (!loading && !loadingMore) {
      fetchLogs(1, true);
    }
  }, [loading, loadingMore, fetchLogs]);

  // Auto-load more when scrolling to bottom
  useEffect(() => {
    if (!loadMoreRef.current || searchTerm || !mounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, searchTerm, mounted, loadMore]);

  useEffect(() => {
    if (autoRefresh && mounted) {
      const interval = setInterval(autoRefreshCallback, 30000); // Refresh every 30 seconds

      refreshIntervalRef.current = interval;

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }
  }, [autoRefresh, mounted, autoRefreshCallback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Fetch logs on component mount
  const fetchLogsCallback = React.useCallback(() => {
    fetchLogs(1, true);
  }, [fetchLogs]);

  useEffect(() => {
    if (mounted) {
      fetchLogsCallback(); // Reset to page 1 and clear existing logs
    }
  }, [mounted, fetchLogsCallback]);

  // Filter logs based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter(
        (log) =>
          log.articleSlug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.browser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.os?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLogs(filtered);
    }
  }, [logs, searchTerm]);

  // Reset to first page when search changes
  useEffect(() => {
    if (searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const getBrowserIcon = (browser?: string) => {
    if (!browser) return <Monitor className="w-4 h-4" />;

    const browserLower = browser.toLowerCase();
    if (browserLower.includes("chrome"))
      return <Monitor className="w-4 h-4 text-blue-500" />;
    if (browserLower.includes("firefox"))
      return <Monitor className="w-4 h-4 text-orange-500" />;
    if (browserLower.includes("safari"))
      return <Monitor className="w-4 h-4 text-green-500" />;
    if (browserLower.includes("edge"))
      return <Monitor className="w-4 h-4 text-purple-500" />;
    return <Monitor className="w-4 h-4" />;
  };

  const getOSBadgeVariant = (os?: string) => {
    if (!os) return "secondary";

    const osLower = os.toLowerCase();
    if (osLower.includes("windows")) return "default";
    if (osLower.includes("mac")) return "outline";
    if (osLower.includes("linux")) return "secondary";
    if (osLower.includes("android") || osLower.includes("ios"))
      return "destructive";
    return "secondary";
  };

  const formatDateTime = (dateString: string) => {
    if (!mounted) return "Loading..."; // Prevent hydration issues

    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getMaskedIP = (ip?: string) => {
    if (!ip) return "Unknown";
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return ip.substring(0, ip.length - 4) + "xxxx";
  };

  const getReferrerHostname = (referrer?: string) => {
    if (!referrer) return "Direct";

    try {
      // Try to parse as URL
      const url = new URL(referrer);
      return url.hostname;
    } catch {
      // If it's not a valid URL, check if it's just a domain
      if (referrer.includes(".") && !referrer.includes(" ")) {
        // Remove protocol if present
        const cleanReferrer = referrer.replace(/^https?:\/\//, "");
        // Extract hostname part
        const hostname = cleanReferrer.split("/")[0];
        return hostname;
      }
      // If all else fails, return the first 30 characters
      return referrer.length > 30
        ? referrer.substring(0, 30) + "..."
        : referrer;
    }
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <RefreshCcw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Loading visitor activity logs...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Visitor Activity Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor which articles are being visited and track visitor details
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Auto-refresh toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm font-medium">
              Auto-refresh (30s)
            </Label>
          </div>

          {/* Manual refresh button */}
          <Button onClick={refreshLogs} disabled={loading}>
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {!loading && logs.length > 0 && <VisitStats logs={logs} />}

      {/* Auto-refresh status */}
      {autoRefresh && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <RefreshCcw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                Auto-refresh is enabled - Updates every 30 seconds
              </span>
            </div>
            {lastRefresh && mounted && (
              <span className="text-xs text-blue-600">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Loading indicator for initial load */}
      {loading && logs.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <RefreshCcw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Loading visitor activity logs...
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by article slug, IP, browser, or OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Badge variant="secondary" className="text-xs">
                Searching: {searchTerm}
              </Badge>
            </div>
          )}
        </div>
        {searchTerm && (
          <p className="text-xs text-muted-foreground mt-1">
            Note: Search is performed on loaded records only. Use pagination to
            load more records for complete search.
          </p>
        )}
      </div>

      {/* Visit Logs Table */}
      {(!loading || logs.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Recent Visitor Activity
            </CardTitle>
            <CardDescription>
              Detailed log of article visits with visitor information
              {filteredLogs.length !== logs.length && (
                <span className="ml-2 text-blue-600">
                  (Showing {filteredLogs.length} of {logs.length} loaded
                  records)
                </span>
              )}
              {!searchTerm && totalRecords > logs.length && (
                <span className="ml-2 text-green-600">
                  (Loaded {logs.length} of {totalRecords} total records)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableCaption>
                {filteredLogs.length === 0 && !loading
                  ? "No visit logs found"
                  : `Last ${filteredLogs.length} visitor activities`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Article Slug</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Operating System</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Visit Time</TableHead>
                  <TableHead className="w-[70px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCcw className="w-4 h-4 animate-spin mx-auto mb-2" />
                      Loading visit logs...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-red-500"
                    >
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {searchTerm
                        ? "No visit logs match your search"
                        : "No visit logs found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {log.articleSlug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {getMaskedIP(log.ipAddress)}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getBrowserIcon(log.browser)}
                          <span>{log.browser || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getOSBadgeVariant(log.os)}>
                          {log.os || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          <span className="text-xs text-muted-foreground">
                            {getReferrerHostname(log.referrer)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">
                            {formatDateTime(log.visitTimestamp)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast.info("Visit Details", {
                              description: `User Agent: ${
                                log.userAgent || "Not available"
                              }`,
                            });
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination and Load More Controls */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Pagination Info */}
        <div className="text-sm text-muted-foreground">
          {!loading && logs.length > 0 && (
            <>
              Showing {Math.min(filteredLogs.length, logs.length)} of{" "}
              {totalRecords} records
              {searchTerm && filteredLogs.length !== logs.length && (
                <span className="ml-2 text-blue-600">
                  (filtered from {logs.length} loaded records)
                </span>
              )}
            </>
          )}
        </div>

        {/* Load More / Pagination Controls */}
        <div className="flex items-center gap-2">
          {!searchTerm && (
            <>
              {/* Load More Button (Infinite Scrolling) */}
              {hasMore && (
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  size="sm"
                >
                  {loadingMore ? (
                    <>
                      <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <MoreHorizontal className="w-4 h-4 mr-2" />
                      Load More
                    </>
                  )}
                </Button>
              )}

              {/* Manual Pagination Controls */}
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => fetchLogs(Math.max(1, currentPage - 1), true)}
                  disabled={currentPage <= 1 || loading}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="px-3 py-1 text-sm bg-muted rounded">
                  {currentPage} of {totalPages}
                </span>

                <Button
                  onClick={() =>
                    fetchLogs(Math.min(totalPages, currentPage + 1), true)
                  }
                  disabled={currentPage >= totalPages || loading}
                  variant="outline"
                  size="sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Auto-Load More on Scroll (Infinite Scrolling) */}
      {!searchTerm && hasMore && (
        <div ref={loadMoreRef} className="mt-8 flex justify-center py-4">
          <div className="text-center text-muted-foreground text-sm">
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Loading more records...
              </div>
            ) : (
              <div className="opacity-50">
                Scroll down to load more records automatically
              </div>
            )}
          </div>
        </div>
      )}

      {/* End of results indicator */}
      {!hasMore && logs.length > 0 && !searchTerm && (
        <div className="mt-8 text-center text-muted-foreground text-sm py-4 border-t">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            You&apos;ve reached the end of all {totalRecords} visit records
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitLogsPage;
