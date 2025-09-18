// app/articles/page.tsx (or wherever your GlobalArticlesPage is located)

"use client";

import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // If needed for metrics
import { Search } from "lucide-react";
import { EyeIcon } from "lucide-react"; // Assuming lucide-react is installed

// --- Interfaces for Real Data ---
interface Article {
  id: string;
  title: string;
  slug: string;
  author: string;
  publishedAt: string | null;
  category: string; // Assuming category is a string for simplicity here
  isBreaking: boolean;
  views: number;
  // Add other properties as needed
}

interface Category {
  id: string; // Or name, depending on your API response
  name: string;
}

// Reusing CardContent for footer structure if CardFooter isn't defined
const CardFooter = CardContent;

// --- Breaking News Sidebar Component (can be reused or adapted) ---
const BreakingNewsSidebar = ({ articles }: { articles: Article[] }) => {
  const breakingNews = articles
    .filter((article) => article.isBreaking)
    .sort((a, b) => {
      // Safely handle date comparison with null checks
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Breaking News</CardTitle>
      </CardHeader>
      <CardContent>
        {breakingNews.length > 0 ? (
          <div className="space-y-4">
            {breakingNews.slice(0, 5).map((article) => (
              <div
                key={article.id}
                className="pb-4 border-b last:border-b-0 last:pb-0"
              >
                <Link
                  href={`/articles/${article.slug}`}
                  className="font-semibold hover:underline text-blue-600 block mb-1"
                >
                  {article.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Date unavailable"}
                </p>
                {article.category && (
                  <Badge variant="outline" className="mt-1">
                    {article.category}
                  </Badge>
                )}
              </div>
            ))}
            {breakingNews.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                <Link
                  href="/articles/breaking-news"
                  className="hover:underline"
                >
                  More breaking news...
                </Link>
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No breaking news currently.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// --- Article Card Component ---
const ArticleCard = ({ article }: { article: Article }) => (
  <Card className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
    <CardHeader>
      <CardTitle>
        <Link
          href={`/articles/${article.slug}`}
          className="text-lg hover:underline"
        >
          {article.title}
        </Link>
      </CardTitle>
      <CardDescription>
        By {article.author} on{" "}
        {article.publishedAt
          ? new Date(article.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "N/A"}
        {article.isBreaking && (
          <Badge variant="destructive" className="ml-2">
            Breaking
          </Badge>
        )}
      </CardDescription>
    </CardHeader>
    <CardContent>
      {/* Placeholder for summary, replace with actual article summary if available */}
      <p className="text-sm text-muted-foreground line-clamp-3">
        {article.title} provides insights into the latest developments and key
        takeaways...
      </p>
    </CardContent>
    <CardFooter className="flex justify-between items-center pt-2">
      <Badge variant="outline">{article.category}</Badge>
      <div className="text-xs text-muted-foreground flex items-center">
        <EyeIcon className="h-3 w-3 mr-1" /> {article.views}
      </div>
    </CardFooter>
  </Card>
);

// --- Article List Component ---
const ArticleList = ({ articles }: { articles: Article[] }) => {
  if (!articles || articles.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No articles found.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};

// --- Global Articles Page Component ---
const GlobalArticlesPage = () => {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // State for dynamic categories
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- API Call Functions ---
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from your API endpoint that lists articles (e.g., /api/articles)
      const response = await fetch("/api/articales");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const data: Article[] = await response.json();
      setAllArticles(data);
      setFilteredArticles(data); // Initialize filtered articles with all fetched articles
    } catch (err: any) {
      setError(err.message);
      setAllArticles([]);
      setFilteredArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      // Fetch categories from your API (e.g., /api/categories)
      const response = await fetch("/api/categories");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
      setCategories([]); // Clear categories on error
    }
  }, []);

  // --- Track Page Visits ---
  useEffect(() => {
    const trackPageVisit = async () => {
      try {
        // Only run this code on the client
        if (typeof window === "undefined") return;

        const userAgent = navigator.userAgent;
        if (/bot|crawl|spider|mediapartners/i.test(userAgent)) {
          console.log("Skipping visit tracking for bot.");
          return;
        }
        const referrer = document.referrer || "Direct";

        const response = await fetch("/api/trackVisitor", {
          // Use your actual visitor tracking API endpoint
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleSlug: "homepage", referrer: referrer }),
        });

        if (!response.ok) {
          console.error("Failed to track page visit:", response.statusText);
        } else {
          console.log("Page visit tracked successfully");
        }
      } catch (err) {
        console.error("Error tracking page visit:", err);
      }
    };

    // Ensure this only runs on the client
    if (typeof window !== "undefined") {
      // Delay slightly to ensure proper hydration
      const timer = setTimeout(() => {
        trackPageVisit();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  // --- Fetch initial data ---
  useEffect(() => {
    fetchArticles();
    fetchCategories(); // Fetch categories when the component mounts
  }, [fetchArticles, fetchCategories]);

  // --- Filter articles based on search term and selected category ---
  useEffect(() => {
    let currentFiltered = allArticles;

    // Filter by category
    if (selectedCategory !== "all") {
      currentFiltered = currentFiltered.filter(
        (article) =>
          article.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      currentFiltered = currentFiltered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredArticles(currentFiltered);
  }, [searchTerm, selectedCategory, allArticles]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Articles</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
        {/* Sidebar for Breaking News */}
        <aside className="lg:col-span-1">
          <BreakingNewsSidebar articles={allArticles} />
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-1">
          {/* Controls Section: Search and Category Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            {/* Search Bar */}
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles by title, author, category..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filters (Tabs) */}
            <Tabs
              value={selectedCategory}
              onValueChange={(value) => handleCategoryChange(value)}
              className="w-full md:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>{" "}
                {/* Always include "All" category */}
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {" "}
                    {/* Use cat.id for value */}
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Article List */}
          {loading && (
            <div className="text-center py-10">
              <p>Loading articles...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-10 text-red-500">
              <p>Error loading articles: {error}</p>
            </div>
          )}
          {!loading && !error && <ArticleList articles={filteredArticles} />}
        </main>
      </div>
    </div>
  );
};

export default GlobalArticlesPage;
