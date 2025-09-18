// app/admin/logs/page.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area"; // For scrollable content
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react"; // Icon for refresh

// Placeholder for EyeIcon if needed, not directly used here but for consistency
const EyeIcon = ({ className, ...props }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

// --- Interface for Log Data (matches your Prisma schema) ---
interface VisitLog {
  id: string;
  articleSlug: string;
  visitTimestamp: string; // Stored as string from API, will parse
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  referrer: string | null;
  customData: any | null; // Use 'any' for flexibility with Json type
}

// --- Component for displaying a single log entry ---
const LogEntry = ({ log }: { log: VisitLog }) => {
  const [showDetails, setShowDetails] = useState(false);
  const timestamp = new Date(log.visitTimestamp);

  return (
    <div className="p-4 border-b last:border-b-0 border-muted/20 hover:bg-accent/10 transition-colors duration-200">
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="font-semibold text-primary">
            {log.articleSlug === "homepage" ? "Homepage" : log.articleSlug}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            ({timestamp.toLocaleString()})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide" : "Details"}
        </Button>
      </div>
      {showDetails && (
        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p>
            <strong>IP Address:</strong> {log.ipAddress || "N/A"}
          </p>
          <p>
            <strong>Browser:</strong> {log.browser || "N/A"} ({log.os || "N/A"})
          </p>
          <p>
            <strong>User Agent:</strong> {log.userAgent || "N/A"}
          </p>
          <p>
            <strong>Referrer:</strong> {log.referrer || "N/A"}
          </p>
          {log.customData && Object.keys(log.customData).length > 0 && (
            <p>
              <strong>Custom Data:</strong> {JSON.stringify(log.customData)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const AdminLogsPage = () => {
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true); 

  
  const refreshIntervalId = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = async () => {
    try {
      setError(null); 
      setLoading(true);
      const response = await fetch("/api/admin/logs");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const data: VisitLog[] = await response.json();

      const sortedData = data.sort(
        (a, b) =>
          new Date(b.visitTimestamp).getTime() -
          new Date(a.visitTimestamp).getTime()
      );
      setLogs(sortedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchLogs(); // Initial fetch

    if (autoRefreshEnabled) {
    
      refreshIntervalId.current = setInterval(fetchLogs, 10000);
    }

    
    return () => {
      if (refreshIntervalId.current) {
        clearInterval(refreshIntervalId.current);
      }
    };
  }, [autoRefreshEnabled]); 

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Live User Activity</CardTitle>
          <CardDescription>
            See who is visiting your articles in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Recent Visits ({logs.length})
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoRefresh}
                className={` ${
                  autoRefreshEnabled
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : ""
                }`}
              >
                {autoRefreshEnabled ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchLogs}
                disabled={loading}
                className="flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh Now
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
            {loading && !error && (
              <div className="text-center py-10">
                <p>Loading logs...</p>
              </div>
            )}
            {error && (
              <div className="text-center py-10 text-red-500">
                <p>Error loading logs: {error}</p>
              </div>
            )}
            {!loading && !error && logs.length === 0 && (
              <p className="text-center py-10 text-muted-foreground">
                No recent visit logs found.
              </p>
            )}
            {!loading && !error && logs.length > 0 && (
              <div>
                {logs.map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogsPage;
