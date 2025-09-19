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
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, EyeIcon, Star } from "lucide-react";

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
            {breakingNews.slice(0, 3).map((article) => (
              <div
                key={article.id}
                className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
              >
                <Link
                  href={`/articles/${article.slug}`}
                  className="font-semibold hover:underline text-destructive block mb-2"
                >
                  {article.title}
                </Link>
                <p className="text-xs text-muted-foreground mb-2">
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
            {breakingNews.length > 3 && (
              <div className="text-center mt-4">
                <Link
                  href="/breaking-news"
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  See all breaking news →
                </Link>
              </div>
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

// --- Top Rated Articles Sidebar Component ---
const TopRatedSidebar = ({ articles }: { articles: Article[] }) => {
  const topRated = articles
    .filter((article) => article.views > 0)
    .sort((a, b) => b.views - a.views);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Top Rated Articles
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topRated.length > 0 ? (
          <div className="space-y-4">
            {topRated.slice(0, 3).map((article, index) => (
              <div
                key={article.id}
                className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/articles/${article.slug}`}
                      className="font-semibold hover:underline text-primary block mb-1 text-sm line-clamp-2"
                    >
                      {article.title}
                    </Link>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                      <div className="flex items-center">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        {article.views.toLocaleString()}
                      </div>
                    </div>
                    {article.category && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {article.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {topRated.length > 3 && (
              <div className="text-center mt-4">
                <Link
                  href="/top-rated"
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  See all top rated →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No top rated articles yet.
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch articles";
      setError(errorMessage);
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch categories";
      setError(errorMessage);
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
      // Find the category name by ID for filtering
      const selectedCategoryObj = categories.find(
        (cat) => cat.id === selectedCategory
      );
      if (selectedCategoryObj) {
        currentFiltered = currentFiltered.filter(
          (article) =>
            article.category?.toLowerCase() ===
            selectedCategoryObj.name.toLowerCase()
        );
      }
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
  }, [searchTerm, selectedCategory, allArticles, categories]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Articles</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        {/* Sidebar for Breaking News and Top Rated */}
        <aside className="lg:col-span-1 space-y-6">
          <BreakingNewsSidebar articles={allArticles} />
          <TopRatedSidebar articles={allArticles} />
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
              className="w-full md:w-auto overflow-x-scroll"
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

export { BreakingNewsSidebar, TopRatedSidebar, ArticleCard };
export default GlobalArticlesPage;
