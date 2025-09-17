// app/admin/dashboard/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; // Assuming Next.js for linking

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge"; // For status indicators
import { Progress } from "@/components/ui/progress"; // For metrics visualization
import { Search } from "lucide-react"; // For search icon
import { Input } from "@/components/ui/input"; // For search input

// --- Dummy Data ---
// In a real app, fetch this from your backend API

const dummyPublishedArticles = [
  {
    id: "art-101",
    title: "The Rise of AI in Content Creation",
    slug: "the-rise-of-ai-in-content-creation",
    author: "Alice",
    publishedAt: "2023-10-25",
    status: "Published",
    views: 1500,
    comments: 45,
  },
  {
    id: "art-102",
    title: "Advanced CSS Techniques for Modern Web",
    slug: "advanced-css-techniques-for-modern-web",
    author: "Bob",
    publishedAt: "2023-10-24",
    status: "Published",
    views: 800,
    comments: 20,
  },
  {
    id: "art-103",
    title: "Understanding Node.js Event Loop",
    slug: "understanding-node-js-event-loop",
    author: "Charlie",
    publishedAt: "2023-10-23",
    status: "Published",
    views: 1200,
    comments: 30,
  },
  {
    id: "art-104",
    title: "5 Tips for Better Sleep Hygiene",
    slug: "5-tips-for-better-sleep-hygiene",
    author: "David",
    publishedAt: "2023-10-22",
    status: "Published",
    views: 2500,
    comments: 70,
  },
];

const dummyMetrics = {
  totalArticles: 55,
  publishedArticles: 4, // Corresponds to dummyPublishedArticles count
  draftArticles: 12,
  totalViews: 5500,
  totalComments: 165,
  breakingNewsCount: 1,
  topRatedCount: 2,
};

// --- Article Table Component ---
const ArticlesTable = ({ articles, searchTerm }) => {
  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchTerm.toLowerCase())
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
      <TableCaption>A list of published articles.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Published Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Views</TableHead>
          <TableHead className="text-right">Comments</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredArticles.map((article) => (
          <TableRow key={article.id}>
            <TableCell className="font-medium">
              <Link
                href={`/articles/${article.slug}`}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                {article.title}
              </Link>
            </TableCell>
            <TableCell>{article.author}</TableCell>
            <TableCell>{article.publishedAt}</TableCell>
            <TableCell>
              <Badge
                variant={
                  article.status === "Published" ? "default" : "secondary"
                }
              >
                {article.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{article.views}</TableCell>
            <TableCell className="text-right">{article.comments}</TableCell>
            <TableCell>
              <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/articles/edit/${article.id}`}>Edit</Link>
                </Button>
                {/* Add delete button if needed */}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// --- Dashboard Page Component ---
const AdminDashboardPage = () => {
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Simulate fetching data
  useEffect(() => {
    // In a real app, fetch from your backend API
    setPublishedArticles(dummyPublishedArticles);
    setMetrics(dummyMetrics);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Metrics Cards */}
      {metrics && (
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

      {/* Main Content Area: Articles List & Other Sections */}
      <div className="grid grid-cols-1 lg:grid-template-columns gap-8">
        {" "}
        {/* Adjust grid columns */}
        <Card className="col-span-2 shadow-sm">
          {" "}
          {/* Make article list span more columns */}
          <CardHeader>
            <CardTitle>Published Articles</CardTitle>
            <CardDescription>Overview of all live articles.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar for Articles */}
            <div className="mb-4 flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles by title, author, slug..."
                  className="pl-8 max-w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button asChild>
                <Link href="/admin/articles/create">Create New Article</Link>
              </Button>
            </div>

            {/* Articles Table */}
            <ArticlesTable
              articles={publishedArticles}
              searchTerm={searchTerm}
            />
          </CardContent>
        </Card>
        {/* Right Sidebar / Other Dashboad Sections */}
        <div className="col-span-1 space-y-8">
          {/* Breaking News Section */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Breaking News</CardTitle>
            </CardHeader>
            <CardContent>
              {dummyPublishedArticles.filter(
                (a) =>
                  a.status === "Published" &&
                  a.title.toLowerCase().includes("ai")
              ).length > 0 ? ( // Example filter for breaking news
                dummyPublishedArticles
                  .filter(
                    (a) =>
                      a.status === "Published" &&
                      a.title.toLowerCase().includes("ai")
                  ) // Replace with actual breaking news flag/logic
                  .slice(0, 3) // Show top 3
                  .map((article) => (
                    <div
                      key={article.id}
                      className="mb-3 pb-3 border-b last:border-b-0 last:pb-0"
                    >
                      <Link
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        className="font-semibold hover:underline text-blue-600"
                      >
                        {article.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        {article.author} - {article.publishedAt}
                      </p>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground">
                  No breaking news articles currently.
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
              {dummyPublishedArticles.filter((a) => a.views > 1000).length >
              0 ? ( // Example filter for top rated
                dummyPublishedArticles
                  .filter((a) => a.views > 1000) // Replace with actual top-rated logic
                  .sort((a, b) => b.views - a.views) // Sort by views descending
                  .slice(0, 3) // Show top 3
                  .map((article) => (
                    <div
                      key={article.id}
                      className="mb-3 pb-3 border-b last:border-b-0 last:pb-0"
                    >
                      <Link
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        className="font-semibold hover:underline text-blue-600"
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

          {/* Example: Recent Activity Summary (placeholder) */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Activity log summary would go here...
              </p>
              {/* Could link to the User Activities page */}
              <Button variant="outline" size="sm" asChild className="mt-4">
                <Link href="/admin/users/activities">
                  View Full Activity Log
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
