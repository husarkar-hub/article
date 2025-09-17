"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; // For internal navigation

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
// Ensure you have these components or define them if not using Shadcn directly
// import { EyeIcon } from "lucide-react"; // Assuming you have lucide-react installed

// Placeholder for EyeIcon if lucide-react is not installed
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
const CardFooter = CardContent; // Reusing CardContent for footer structure

// --- Dummy Data ---
const dummyArticles = [
  {
    id: "art-101",
    title: "The Rise of AI in Content Creation",
    slug: "the-rise-of-ai-in-content-creation",
    author: "Alice",
    publishedAt: "2023-10-25",
    category: "Technology",
    isBreaking: true,
    views: 1500,
  },
  {
    id: "art-102",
    title: "Advanced CSS Techniques for Modern Web",
    slug: "advanced-css-techniques-for-modern-web",
    author: "Bob",
    publishedAt: "2023-10-24",
    category: "Web Development",
    isBreaking: false,
    views: 800,
  },
  {
    id: "art-103",
    title: "Understanding Node.js Event Loop",
    slug: "understanding-node-js-event-loop",
    author: "Charlie",
    publishedAt: "2023-10-23",
    category: "Technology",
    isBreaking: false,
    views: 1200,
  },
  {
    id: "art-104",
    title: "5 Tips for Better Sleep Hygiene",
    slug: "5-tips-for-better-sleep-hygiene",
    author: "David",
    publishedAt: "2023-10-22",
    category: "Health",
    isBreaking: false,
    views: 2500,
  },
  {
    id: "art-105",
    title: "URGENT: Major Political Development!",
    slug: "urgent-major-political-development",
    author: "Eve",
    publishedAt: "2023-10-27",
    category: "Politics",
    isBreaking: true,
    views: 3000,
  },
  {
    id: "art-106",
    title: "New Sci-Fi Movie Trailer Released",
    slug: "new-sci-fi-movie-trailer-released",
    author: "Frank",
    publishedAt: "2023-10-26",
    category: "Entertainment",
    isBreaking: false,
    views: 1800,
  },
  {
    id: "art-107",
    title: "Breaking: Unexpected Market Shift!",
    slug: "breaking-unexpected-market-shift",
    author: "Grace",
    publishedAt: "2023-10-27 10:00:00",
    category: "Business",
    isBreaking: true,
    views: 4500,
  }, // More recent breaking news
];

const dummyCategories = [
  { id: "all", name: "All" },
  { id: "technology", name: "Technology" },
  { id: "web-development", name: "Web Development" },
  { id: "health", name: "Health" },
  { id: "politics", name: "Politics" },
  { id: "entertainment", name: "Entertainment" },
  { id: "business", name: "Business" }, // Added Business category
];

// --- Breaking News Sidebar Component ---
const BreakingNewsSidebar = ({ articles }: { articles: any[] }) => {
  // Filter for breaking news and sort by date (most recent first)
  const breakingNews = articles
    .filter((article) => article.isBreaking)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Breaking News</CardTitle>
      </CardHeader>
      <CardContent>
        {breakingNews.length > 0 ? (
          <div className="space-y-4">
            {breakingNews.slice(0, 5).map(
              (
                article // Show top 5 breaking news
              ) => (
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
                    {new Date(article.publishedAt).toLocaleString()}
                  </p>
                  {article.category && (
                    <Badge variant="outline" className="mt-1">
                      {article.category}
                    </Badge>
                  )}
                </div>
              )
            )}
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
const ArticleCard = ({ article }: { article: any }) => (
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
        {new Date(article.publishedAt).toLocaleDateString()}
        {article.isBreaking && (
          <Badge variant="destructive" className="ml-2">
            Breaking
          </Badge>
        )}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground line-clamp-3">
        This is a placeholder summary for the article "{article.title}". It
        provides insights into the latest developments and key takeaways...
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
const ArticleList = ({ articles }: { articles: any[] }) => {
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
  const [allArticles, setAllArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        // Replace with your actual API call
        const data = dummyArticles; // Using dummy data for now
        setAllArticles(data);
        setFilteredArticles(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  useEffect(() => {
    let currentFiltered = allArticles;

    if (selectedCategory !== "all") {
      currentFiltered = currentFiltered.filter(
        (article) =>
          article.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

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
        {" "}

        <aside className="lg:col-span-1">
          <BreakingNewsSidebar articles={allArticles} />{" "}
          {/* Pass all articles to filter */}
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
                {dummyCategories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id}>
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

      {/* Optional: Secondary sidebar or footer content can go here */}
    </div>
  );
};

export default GlobalArticlesPage;
