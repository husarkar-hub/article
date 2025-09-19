// app/admin/dashboard/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

// Import Shadcn UI components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Edit, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Interfaces for Real Data ---
interface Article {
  id: string;
  title: string;
  slug: string;
  author: string;
  publishedAt: string | null; // Can be null for drafts
  status: "Published" | "Draft" | "Archived"; // Enum of possible statuses
  views: number;
  isBreaking?: boolean; // Optional for breaking news
  isTopRated?: boolean; // Optional for top rated
}

interface DashboardMetrics {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  archivedArticles: number; // Added for completeness
  totalViews: number;
  breakingNewsCount: number;
  topRatedCount: number;
}

// --- Component for displaying a single article row ---
const ArticleRow = ({
  article,
  onUpdateStatus,
}: {
  article: Article;
  onUpdateStatus: (id: string, newStatus: Article["status"]) => Promise<void>;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<Article["status"]>(
    article.status
  );

  const handleStatusChange = async (newStatus: Article["status"]) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(article.id, newStatus);
      setCurrentStatus(newStatus); // Update local state only on success
    } catch (error) {
      console.error("Failed to update status:", error);
      // Optionally show an error message to the user
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <TableRow key={article.id}>
      <TableCell className="font-medium">
        <Link
          href={`/articles/${article.slug}`}
          target="_blank"
          className="text-blue-600 hover:underline flex items-center"
        >
          <Eye className="h-4 w-4 mr-2" /> {article.title}
        </Link>
      </TableCell>
      <TableCell>{article.author}</TableCell>
      <TableCell>
        {article.publishedAt
          ? new Date(article.publishedAt).toLocaleDateString()
          : "-"}
      </TableCell>
      <TableCell>
        <Select
          value={currentStatus}
          onValueChange={(value) =>
            handleStatusChange(value as Article["status"])
          }
          disabled={isUpdating}
        >
          <SelectTrigger>
            {article.status} <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">{article.views}</TableCell>

      <TableCell>
        <div className="flex items-center justify-end space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/articles/edit/${article.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            // onClick={() => handleDelete(article.id)} // Implement delete if needed
            disabled={isUpdating} // Disable if updating another status
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// --- Article Table Component (Updated) ---
const ArticlesTable = ({
  articles,
  searchTerm,
  onUpdateStatus,
}: {
  articles: Article[];
  searchTerm: string;
  onUpdateStatus: (id: string, newStatus: Article["status"]) => Promise<void>;
}) => {
  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.status.toLowerCase().includes(searchTerm.toLowerCase()) // Allow searching by status
  );

  if (filteredArticles.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No articles found matching your search.
      </p>
    );
  }

  return (
    <Table>
      <TableCaption>A list of articles.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Published Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Views</TableHead>

          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredArticles.map((article) => (
          <ArticleRow
            key={article.id}
            article={article}
            onUpdateStatus={onUpdateStatus}
          />
        ))}
      </TableBody>
    </Table>
  );
};

// --- Dashboard Page Component ---
const AdminDashboardPage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- API Call Functions ---
  const fetchArticles = async () => {
    setLoadingArticles(true);
    setError(null);
    try {
      // Fetch from your API endpoint that lists articles
      const response = await fetch("/api/admin/articles");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data: Article[] = await response.json();
      setArticles(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load articles";
      setError(`Failed to load articles: ${errorMessage}`);
      setArticles([]); // Clear articles on error
    } finally {
      setLoadingArticles(false);
    }
  };

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    setError(null);
    try {
      // Fetch from your API endpoint for dashboard metrics
      const response = await fetch("/api/admin/dashboard/metrics");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data: DashboardMetrics = await response.json();
      setMetrics(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load metrics";
      setError(`Failed to load metrics: ${errorMessage}`);
      setMetrics(null); // Clear metrics on error
    } finally {
      setLoadingMetrics(false);
    }
  };

  // --- Status Update Function ---
  const handleUpdateStatus = async (
    id: string,
    newStatus: Article["status"]
  ) => {
    try {
      const response = await fetch(`/api/admin/articles/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to update status (HTTP ${response.status})`
        );
      }

      // Optimistic update or re-fetch articles after successful update
      // For simplicity, we'll re-fetch all articles
      fetchArticles();
      // Optionally, re-fetch metrics if status changes affect them
      // fetchMetrics();

      // Show success message (e.g., using a toast notification)
      console.log(`Status for article ${id} updated to ${newStatus}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update status";
      console.error("Error updating article status:", errorMessage);
      throw error; // Re-throw to be caught by ArticleRow
    }
  };

  // --- Effect to fetch data on mount ---
  useEffect(() => {
    fetchArticles();
    fetchMetrics();
  }, []);

  // --- Function to delete an article - currently unused ---
  // const handleDeleteArticle = async (id: string) => {
  //   if (
  //     !confirm(
  //       "Are you sure you want to delete this article? This action cannot be undone."
  //     )
  //   ) {
  //     return;
  //   }
  //   try {
  //     const response = await fetch(`/api/admin/articles/${id}/delete`, {
  //       method: "DELETE",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(
  //         errorData.message ||
  //           `Failed to delete article (HTTP ${response.status})`
  //       );
  //     }

  //     // Re-fetch articles after successful deletion
  //     fetchArticles();
  //     fetchMetrics(); // Metrics might change (e.g., total count)
  //     console.log(`Article ${id} deleted successfully.`);
  //   } catch (error: unknown) {
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to delete article';
  //     console.error("Error deleting article:", errorMessage);
  //     setError(`Failed to delete article: ${errorMessage}`);
  //   }
  // };

  // --- Right Sidebar Data (Example: Breaking/Top Rated) ---
  const breakingNewsArticles = articles
    .filter((article) => article.isBreaking && article.status === "Published")
    .sort(
      (a, b) =>
        new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
    )
    .slice(0, 3); // Get top 3 breaking news

  const topRatedArticles = articles
    .filter((article) => article.isTopRated && article.status === "Published")
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Metrics Cards */}
      {!loadingMetrics && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Total Articles</CardTitle>
              <CardDescription>All articles in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalArticles}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Published</CardTitle>
              <CardDescription>Currently live articles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {metrics.publishedArticles}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Drafts</CardTitle>
              <CardDescription>Articles awaiting publication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.draftArticles}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Total Views</CardTitle>
              <CardDescription>All-time page views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalViews}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading/Error State for Metrics */}
      {loadingMetrics && <p>Loading metrics...</p>}
      {error && !loadingArticles && (
        <p className="text-red-500">Error: {error}</p>
      )}

      {/* Main Content Area: Articles List & Other Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {" "}
        {/* Adjusted grid for sidebar */}
        {/* Article List Section (Spans 2 columns) */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Articles Management</CardTitle>
            <CardDescription>
              Overview and management of all articles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar for Articles */}
            <div className="mb-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by title, author, slug, status..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button asChild>
                <Link href="/admin/articles">Create New Article</Link>
              </Button>
            </div>

            {/* Articles Table */}
            {loadingArticles && !error && <p>Loading articles...</p>}
            {!loadingArticles && !error && (
              <ArticlesTable
                articles={articles}
                searchTerm={searchTerm}
                onUpdateStatus={handleUpdateStatus}
              />
            )}
            {error && !loadingArticles && (
              <p className="text-red-500">Error: {error}</p>
            )}
          </CardContent>
        </Card>
        {/* Right Sidebar / Other Dashboard Sections */}
        <div className="col-span-1 space-y-8">
          {/* Breaking News Section */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Breaking News</CardTitle>
            </CardHeader>
            <CardContent>
              {breakingNewsArticles.length > 0 ? (
                breakingNewsArticles.map((article) => (
                  <div
                    key={article.id}
                    className="mb-3 pb-3 border-b last:border-b-0 last:pb-0"
                  >
                    <Link
                      href={`/articles/${article.slug}`}
                      target="_blank"
                      className="font-semibold hover:underline text-blue-600 block"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      {article.author} -{" "}
                      {new Date(article.publishedAt!).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  No breaking news articles.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Rated Articles Section */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Top Rated Articles</CardTitle>
            </CardHeader>
            <CardContent>
              {topRatedArticles.length > 0 ? (
                topRatedArticles.map((article) => (
                  <div
                    key={article.id}
                    className="mb-3 pb-3 border-b last:border-b-0 last:pb-0"
                  >
                    <Link
                      href={`/articles/${article.slug}`}
                      target="_blank"
                      className="font-semibold hover:underline text-blue-600 block"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      Views: {article.views}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  No top-rated articles yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Summary */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                See detailed user activity logs.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/logs">View Live Activity Log</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
