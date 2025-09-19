"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  FileText,
  Users,
  BarChart3,
  Plus,
  Calendar,
  Clock,
  Star,
} from "lucide-react";
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
  author: {
    email: string;
    id: string;
  };
  category: {
    name: string;
    id: string;
  } | null;
  publishedAt: string | null; // Can be null for drafts
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED"; // Match Prisma enum
  views: number;
  isBreakingNews?: boolean; // Optional for breaking news
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
    <TableRow key={article.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">
        <div className="flex items-center space-x-2">
          <Link
            href={`/articles/${article.slug}`}
            target="_blank"
            className="text-blue-600 hover:underline flex items-center group"
          >
            <Eye className="h-4 w-4 mr-2 opacity-50 group-hover:opacity-100" />
            <span className="truncate max-w-[200px]">{article.title}</span>
          </Link>
          {article.isBreakingNews && (
            <Badge variant="destructive" className="text-xs">
              Breaking
            </Badge>
          )}
          {article.isTopRated && (
            <Badge variant="default" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Top
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          <div className="bg-muted rounded-full h-8 w-8 flex items-center justify-center mr-2">
            <span className="text-xs font-medium">
              {article.author?.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          {article.author?.email?.split("@")[0] || "Unknown"}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-1 opacity-50" />
          {article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString()
            : "-"}
        </div>
      </TableCell>
      <TableCell>
        <Select
          value={currentStatus}
          onValueChange={(value) =>
            handleStatusChange(value as Article["status"])
          }
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLISHED">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Published
              </span>
            </SelectItem>
            <SelectItem value="DRAFT">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Draft
              </span>
            </SelectItem>
            <SelectItem value="ARCHIVED">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                Archived
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end">
          <TrendingUp className="h-4 w-4 mr-1 opacity-50" />
          <span className="font-medium">{article.views.toLocaleString()}</span>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-end space-x-2">
          <Button variant="outline" size="sm" asChild className="h-8 w-8 p-0">
            <Link href={`/admin/articles/edit/${article.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 w-8 p-0"
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
      article.author?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      if (!response.ok) {
        toast.error("Failed to load articles", {
          description: `Server returned status ${response.status}`,
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Article[] = await response.json();
      setArticles(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load articles";
      setError(`Failed to load articles: ${errorMessage}`);
      setArticles([]); // Clear articles on error

      toast.error("Loading failed", {
        description: "Could not retrieve articles from the server",
      });
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
    const loadingToast = toast.loading("Updating article status...");

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
        toast.dismiss(loadingToast);
        toast.error("Status update failed", {
          description: errorData.message || `HTTP ${response.status} error`,
        });
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

      toast.dismiss(loadingToast);
      toast.success("Status updated successfully!", {
        description: `Article status changed to ${newStatus.toLowerCase()}`,
      });

      console.log(`Status for article ${id} updated to ${newStatus}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update status";
      console.error("Error updating article status:", errorMessage);

      toast.dismiss(loadingToast);
      toast.error("Update failed", {
        description: errorMessage,
      });

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
    .filter(
      (article) => article.isBreakingNews && article.status === "PUBLISHED"
    )
    .sort(
      (a, b) =>
        new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
    )
    .slice(0, 3); // Get top 3 breaking news

  const topRatedArticles = articles
    .filter((article) => article.isTopRated && article.status === "PUBLISHED")
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your articles, users, and site content from here.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="gap-2">
              <Link href="/admin/articles/create">
                <Plus className="h-4 w-4" />
                New Article
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/admin/categories">
                <FileText className="h-4 w-4" />
                Categories
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      {!loadingMetrics && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Articles
                </CardTitle>
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <CardDescription className="text-xs">
                All articles in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {metrics.totalArticles}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Published
                </CardTitle>
                <BarChart3 className="h-5 w-5 text-green-500" />
              </div>
              <CardDescription className="text-xs">
                Currently live articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {metrics.publishedArticles}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Drafts
                </CardTitle>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <CardDescription className="text-xs">
                Articles awaiting publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {metrics.draftArticles}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                -3% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Views
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <CardDescription className="text-xs">
                All-time page views
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {metrics.totalViews.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +24% from last month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading/Error State for Metrics */}
      {loadingMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-sm animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && !loadingArticles && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-destructive font-medium">Error: {error}</p>
        </div>
      )}

      {/* Main Content Area: Articles List & Other Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Article List Section (Spans 2 columns) */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Articles Management
                </CardTitle>
                <CardDescription>
                  Overview and management of all articles.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {articles.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Bar for Articles */}
            <div className="mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by title, author, slug, status..."
                  className="pl-10 w-full h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button asChild className="gap-2 min-w-fit">
                <Link href="/admin/articles">
                  <Plus className="h-4 w-4" />
                  Create New
                </Link>
              </Button>
            </div>

            {/* Articles Table */}
            {loadingArticles && !error && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            )}
            {!loadingArticles && !error && (
              <div className="rounded-lg border">
                <ArticlesTable
                  articles={articles}
                  searchTerm={searchTerm}
                  onUpdateStatus={handleUpdateStatus}
                />
              </div>
            )}
            {error && !loadingArticles && (
              <div className="text-center py-8">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                  <FileText className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <p className="text-destructive font-medium mb-2">
                    Failed to load articles
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button onClick={fetchArticles} variant="outline" size="sm">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Sidebar / Other Dashboard Sections */}
        <div className="col-span-1 space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                asChild
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Link href="/admin/articles/create">
                  <Plus className="h-4 w-4" />
                  Create Article
                </Link>
              </Button>
              <Button
                asChild
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Link href="/admin/categories">
                  <FileText className="h-4 w-4" />
                  Manage Categories
                </Link>
              </Button>
              <Button
                asChild
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Link href="/admin/users">
                  <Users className="h-4 w-4" />
                  User Management
                </Link>
              </Button>
              <Button
                asChild
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Link href="/admin/settings">
                  <BarChart3 className="h-4 w-4" />
                  Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Breaking News Section */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Badge
                  variant="destructive"
                  className="w-2 h-2 p-0 rounded-full"
                >
                  <span className="sr-only">Breaking</span>
                </Badge>
                Breaking News
              </CardTitle>
            </CardHeader>
            <CardContent>
              {breakingNewsArticles.length > 0 ? (
                <div className="space-y-4">
                  {breakingNewsArticles.map((article) => (
                    <div
                      key={article.id}
                      className="group p-3 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                    >
                      <Link
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        className="font-medium hover:underline text-sm block line-clamp-2 mb-2 group-hover:text-destructive"
                      >
                        {article.title}
                      </Link>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span className="bg-muted rounded h-5 w-5 flex items-center justify-center mr-2">
                          {article.author?.email?.charAt(0).toUpperCase() ||
                            "U"}
                        </span>
                        <span className="mr-2">
                          {article.author?.email?.split("@")[0] || "Unknown"}
                        </span>
                        <span>•</span>
                        <span className="ml-2">
                          {new Date(article.publishedAt!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No breaking news articles.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Rated Articles Section */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 text-yellow-500" />
                Top Rated Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topRatedArticles.length > 0 ? (
                <div className="space-y-4">
                  {topRatedArticles.map((article, index) => (
                    <div
                      key={article.id}
                      className="group p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-yellow-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/articles/${article.slug}`}
                            target="_blank"
                            className="font-medium hover:underline text-sm block line-clamp-2 mb-2 group-hover:text-primary"
                          >
                            {article.title}
                          </Link>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            <span className="font-medium">
                              {article.views.toLocaleString()}
                            </span>
                            <span className="ml-1">views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No top-rated articles yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Summary */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                Monitor user interactions and system events in real-time.
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link href="/admin/logs">
                  <Eye className="h-4 w-4 mr-2" />
                  View Activity Log
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
