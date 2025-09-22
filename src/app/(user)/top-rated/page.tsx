// app/(user)/top-rated/page.tsx - SEO Optimized Top Rated Articles Page

"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Search, EyeIcon, ArrowLeft, Star, Trophy, Medal } from "lucide-react";
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

// --- Top Rated Article Card Component ---
const TopRatedCard = ({
  article,
  rank,
}: {
  article: Article;
  rank: number;
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
            {rank}
          </div>
        );
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500 text-white";
      case 2:
        return "bg-gray-400 text-white";
      case 3:
        return "bg-amber-600 text-white";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  return (
    <Card className="flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-yellow-500">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{getRankIcon(rank)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${getRankBadgeColor(rank)} text-xs`}>
                #{rank} TOP RATED
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground">
                <EyeIcon className="h-3 w-3 mr-1" />
                {article.views.toLocaleString()} views
              </div>
            </div>
            <CardTitle>
              <Link
                href={`/articles/${article.slug}`}
                className="text-lg hover:underline text-primary"
              >
                {article.title}
              </Link>
            </CardTitle>
            <CardDescription>
              By {article.author} •{" "}
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Date unavailable"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {article.content
            ? article.content.substring(0, 150) + "..."
            : `${article.title} provides insights into the latest developments and key takeaways...`}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2">
        <Badge variant="outline">{article.category}</Badge>
        <div className="flex items-center gap-2">
          {article.isBreaking && (
            <Badge variant="destructive" className="text-xs">
              Breaking
            </Badge>
          )}
          <div className="flex items-center text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-xs ml-1 text-muted-foreground">
              Top Rated
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

// --- Top Rated List Component ---
const TopRatedList = ({ articles }: { articles: Article[] }) => {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Star className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Top Rated Articles</h3>
        <p className="text-muted-foreground">
          There are currently no top rated articles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 3 Featured Cards */}
      {articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {articles.slice(0, 3).map((article, index) => (
            <div key={article.id} className="relative">
              <div className="absolute -top-3 -left-3 z-10">
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                  ${
                    index === 0
                      ? "bg-yellow-500"
                      : index === 1
                      ? "bg-gray-400"
                      : "bg-amber-600"
                  }
                `}
                >
                  {index + 1}
                </div>
              </div>
              <TopRatedCard article={article} rank={index + 1} />
            </div>
          ))}
        </div>
      )}

      {/* Rest of the articles */}
      {articles.length > 3 && (
        <>
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              More Top Rated Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.slice(3).map((article, index) => (
                <TopRatedCard
                  key={article.id}
                  article={article}
                  rank={index + 4}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// SEO Component for Top Rated Page
const SEOHead = ({ articles }: { articles: Article[] }) => {
  useEffect(() => {
    const topArticleCount = articles.length;
    const dynamicTitle =
      topArticleCount > 0
        ? `Top ${topArticleCount} Rated Articles - Best Content`
        : "Top Rated Articles - Best Content";

    const dynamicDescription =
      topArticleCount > 0
        ? `Discover our top ${topArticleCount} highest-rated articles. Find the best content based on user ratings and engagement. Quality articles you can trust.`
        : "Discover our highest-rated articles. Find the best content based on user ratings and engagement. Quality articles you can trust.";

    document.title = dynamicTitle;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", dynamicDescription);

    // Add structured data for top articles
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Top Rated Articles",
      description: dynamicDescription,
      url: window.location.href,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: topArticleCount,
        itemListElement: articles.slice(0, 10).map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Article",
            headline: article.title,
            description: article.content?.substring(0, 160) || article.title,
            url: `${window.location.origin}/article/${article.id}`,
            datePublished: article.publishedAt,
            author: {
              "@type": "Person",
              name: article.author,
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "5",
              bestRating: "5",
              ratingCount: article.views,
            },
          },
        })),
      },
    };

    // Remove existing structured data
    const existingScript = document.querySelector(
      'script[type="application/ld+json"]'
    );
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement("script") as HTMLScriptElement;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }, [articles]);

  return null;
};

// --- Top Rated Page Component ---
const TopRatedPage = () => {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- API Call Functions ---
  const fetchTopRated = useCallback(async () => {
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

      // Filter and sort by views (top rated)
      const topRated = data
        .filter((article) => article.views > 0)
        .sort((a, b) => b.views - a.views);

      setAllArticles(topRated);
      setFilteredArticles(topRated);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch top rated articles";
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
            articleSlug: "top-rated-page",
            referrer: referrer,
          }),
        });

        if (!response.ok) {
          console.error("Failed to track page visit:", response.statusText);
        } else {
          console.log("Top rated page visit tracked successfully");
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
    fetchTopRated();
  }, [fetchTopRated]);

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

  return (
    <>
      <SEOHead articles={filteredArticles} />
      <div className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              TOP RATED
            </div>
            <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
              <Star className="h-10 w-10 text-yellow-500" />
              Top Rated Articles
            </h1>
          </div>

          <p className="text-muted-foreground text-lg">
            Discover the most popular and highly viewed articles from our
            community. Quality content ranked by reader engagement and views.
          </p>

          {!loading && (
            <div
              className="text-sm text-muted-foreground mt-2"
              role="status"
              aria-live="polite"
            >
              {filteredArticles.length} top rated{" "}
              {filteredArticles.length === 1 ? "article" : "articles"} found
            </div>
          )}
        </header>

        {/* Search Section */}
        <section className="mb-8" aria-label="Search top rated articles">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search top rated articles..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search top rated articles"
            />
          </div>
        </section>

        {/* Content Section */}
        <main role="main">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              <p className="mt-4 text-muted-foreground">
                Loading top rated articles...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
                <Star className="h-12 w-12 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-destructive">
                Error Loading Top Rated Articles
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchTopRated} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && <TopRatedList articles={filteredArticles} />}
        </main>
      </div>
    </>
  );
};

export default TopRatedPage;
