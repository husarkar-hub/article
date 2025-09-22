// app/(user)/breaking-news/page.tsx - SEO Optimized Breaking News Page

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// SEO Component for dynamic title updates
const SEOHead = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  useEffect(() => {
    document.title = title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute("href", window.location.href);
    } else {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", window.location.href);
      document.head.appendChild(canonical);
    }

    // Add structured data for news articles
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      name: "NewsHub",
      url: window.location.origin,
      logo: `${window.location.origin}/logo.png`,
      sameAs: ["https://twitter.com/newshub", "https://facebook.com/newshub"],
    };

    let script = document.querySelector(
      'script[type="application/ld+json"]'
    ) as HTMLScriptElement;
    if (script) {
      script.textContent = JSON.stringify(structuredData);
    } else {
      script = document.createElement("script") as HTMLScriptElement;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [title, description]);

  return null;
};

// Import Shadcn UI components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, EyeIcon, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Interfaces for Real Data ---
interface Article {
  id: string;
  title: string;
  slug: string;
  author: string;
  publishedAt: string | null;
  category: string;
  isBreaking: boolean;
  views: number;
  content?: string;
}

// Reusing CardContent for footer structure if CardFooter isn't defined
const CardFooter = CardContent;

// --- Breaking News Article Card Component ---
const BreakingNewsCard = ({ article }: { article: Article }) => (
  <Card className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-destructive">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="destructive" className="animate-pulse">
              BREAKING
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Date unavailable"}
            </div>
          </div>
          <CardTitle>
            <Link
              href={`/articles/${article.slug}`}
              className="text-lg hover:underline text-destructive"
            >
              {article.title}
            </Link>
          </CardTitle>
          <CardDescription>By {article.author}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground line-clamp-3">
        {article.content
          ? article.content.substring(0, 150) + "..."
          : `${article.title} provides insights into the latest breaking developments and key takeaways...`}
      </p>
    </CardContent>
    <CardFooter className="flex justify-between items-center pt-2">
      <Badge variant="outline">{article.category}</Badge>
      <div className="text-xs text-muted-foreground flex items-center">
        <EyeIcon className="h-3 w-3 mr-1" /> {article.views.toLocaleString()}
      </div>
    </CardFooter>
  </Card>
);

// --- Breaking News List Component ---
const BreakingNewsList = ({ articles }: { articles: Article[] }) => {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Clock className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Breaking News</h3>
        <p className="text-muted-foreground">
          There are currently no breaking news articles.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <BreakingNewsCard key={article.id} article={article} />
      ))}
    </div>
  );
};

// --- Breaking News Page Component ---
const BreakingNewsPage = () => {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- API Call Functions ---
  const fetchBreakingNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/articales");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const data: Article[] = await response.json();

      // Filter only breaking news articles
      const breakingNews = data
        .filter((article) => article.isBreaking)
        .sort((a, b) => {
          if (!a.publishedAt) return 1;
          if (!b.publishedAt) return -1;
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        });

      setAllArticles(breakingNews);
      setFilteredArticles(breakingNews);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch breaking news";
      setError(errorMessage);
      setAllArticles([]);
      setFilteredArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Track Page Visits ---
  useEffect(() => {
    const trackPageVisit = async () => {
      try {
        if (typeof window === "undefined") return;

        const userAgent = navigator.userAgent;
        if (/bot|crawl|spider|mediapartners/i.test(userAgent)) {
          console.log("Skipping visit tracking for bot.");
          return;
        }
        const referrer = document.referrer || "Direct";

        const response = await fetch("/api/trackVisitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleSlug: "breaking-news-page",
            referrer: referrer,
          }),
        });

        if (!response.ok) {
          console.error("Failed to track page visit:", response.statusText);
        } else {
          console.log("Breaking news page visit tracked successfully");
        }
      } catch (err) {
        console.error("Error tracking page visit:", err);
      }
    };

    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        trackPageVisit();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  // --- Fetch initial data ---
  useEffect(() => {
    fetchBreakingNews();
  }, [fetchBreakingNews]);

  // --- Filter articles based on search term ---
  useEffect(() => {
    if (searchTerm) {
      const filtered = allArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredArticles(filtered);
    } else {
      setFilteredArticles(allArticles);
    }
  }, [searchTerm, allArticles]);

  // SEO Dynamic Data
  const pageTitle = `Breaking News - Latest Updates ${
    filteredArticles.length > 0 ? `(${filteredArticles.length} stories)` : ""
  } | NewsHub`;
  const pageDescription = `Stay informed with ${filteredArticles.length} breaking news stories. Get real-time updates on current events, urgent developments, and important news as it happens.`;

  return (
    <>
      <SEOHead title={pageTitle} description={pageDescription} />
      <div className="container mx-auto py-8 px-4">
        {/* Header Section with enhanced SEO */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" aria-label="Return to homepage">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              LIVE
            </div>
            <h1 className="text-4xl font-bold text-destructive">
              Breaking News
            </h1>
          </div>

          <p className="text-muted-foreground text-lg">
            Stay updated with the latest breaking news and urgent developments.
            Real-time coverage of current events.
          </p>

          {!loading && (
            <div className="text-sm text-muted-foreground mt-2">
              {filteredArticles.length} breaking news{" "}
              {filteredArticles.length === 1 ? "article" : "articles"} • Updated
              continuously
            </div>
          )}
        </header>

        {/* Search Section with SEO labels */}
        <section className="mb-8" aria-label="Search breaking news">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search breaking news..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search breaking news articles"
            />
          </div>
        </section>

        {/* Content Section */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-destructive"></div>
            <p className="mt-4 text-muted-foreground">
              Loading breaking news...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-12 w-12 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-destructive">
              Error Loading Breaking News
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchBreakingNews} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && <BreakingNewsList articles={filteredArticles} />}
      </div>
    </>
  );
};
export default BreakingNewsPage;
