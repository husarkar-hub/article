
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EyeIcon,
  CalendarIcon,
  UserIcon,
  ArrowLeftIcon,
  ShareIcon,
  PrinterIcon,
  ClockIcon,
  TagIcon,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: {
    email: string;
  };
  category: {
    name: string;
  } | null;
  publishedAt: string | null;
  views: number;
  isBreakingNews: boolean;
  featuredImageUrl?: string;
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingTime, setReadingTime] = useState(0);

  // Use ref to prevent duplicate API calls in React Strict Mode
  const hasTrackedView = useRef(false); // Calculate reading time (average 200 words per minute)
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const textContent = content.replace(/<[^>]*>/g, ""); // Remove HTML tags
    const wordCount = textContent.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const shareArticle = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: `Check out this article: ${article.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    // You could add a toast notification here
    alert("Article link copied to clipboard!");
  };

  const printArticle = () => {
    window.print();
  };

  useEffect(() => {
    const fetchAndTrackArticle = async () => {
      if (!params.slug) return;

      try {
        setLoading(true);

        // Fetch the article first
        const response = await fetch(`/api/articles/${params.slug}`);
        if (!response.ok) {
          throw new Error("Article not found");
        }

        const articleData = await response.json();
        setArticle(articleData);
        setReadingTime(calculateReadingTime(articleData.content));
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAndTrackArticle();
  }, [params.slug]);

  // Separate effect to track view only once per slug visit
  useEffect(() => {
    const trackView = async () => {
      if (!params.slug || !article || hasTrackedView.current) return;

      try {
        // Mark as tracked to prevent duplicate calls
        hasTrackedView.current = true;

        // Track the visit and increment view count
        await Promise.all([
          fetch("/api/trackVisitor", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              articleSlug: params.slug,
              referrer:
                typeof window !== "undefined"
                  ? document.referrer || "Direct"
                  : "Direct",
            }),
          }),
          fetch(`/api/articles/${params.slug}/view`, {
            method: "POST",
          }),
        ]);

        console.log(`View tracked for article: ${params.slug}`);
      } catch (err) {
        console.error("Error tracking view:", err);
        // Reset flag if tracking failed so it can be retried
        hasTrackedView.current = false;
      }
    };

    trackView();
  }, [article, params.slug]);

  // Reset tracking state when navigating to a different article
  useEffect(() => {
    hasTrackedView.current = false;
    setError(null);
    setArticle(null);
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Loading Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeIcon className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Article Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              {error ||
                "The article you're looking for doesn't exist or may have been removed."}
            </p>
            <Button onClick={() => router.back()} className="mr-2">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Browse Articles</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Article Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareArticle}
                className="flex items-center gap-2"
              >
                <ShareIcon className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={printArticle}
                className="flex items-center gap-2"
              >
                <PrinterIcon className="w-4 h-4" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Article Meta */}
            <div className="flex flex-wrap gap-2 mb-6">
              {article.isBreakingNews && (
                <Badge variant="destructive" className="animate-pulse">
                  🚨 Breaking News
                </Badge>
              )}
              {article.category && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  {article.category.name}
                </Badge>
              )}
            </div>

            {/* Article Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              {article.title}
            </h1>

            {/* Article Info */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 border-b border-gray-200 pb-6">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                <span className="font-medium">
                  By {article.author.email.split("@")[0]}
                </span>
              </div>

              {article.publishedAt && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  <time dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              )}

              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                <span>{readingTime} min read</span>
              </div>

              <div className="flex items-center gap-2">
                <EyeIcon className="w-5 h-5" />
                <span>{article.views.toLocaleString()} views</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {article.featuredImageUrl && (
        <section className="bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
                <Image
                  src={article.featuredImageUrl || "/placeholder.png"}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Article Content */}
      <main className="bg-white">
        <div className="container mx-auto px-4 pb-12">
          <div className="max-w-4xl mx-auto">
            <article
              className="prose prose-lg prose-gray max-w-none
                prose-headings:text-gray-900 prose-headings:font-bold
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:p-4
                prose-img:rounded-lg prose-img:shadow-lg
                prose-table:w-full prose-table:border-collapse
                prose-th:bg-gray-50 prose-th:border prose-th:border-gray-300 prose-th:p-2
                prose-td:border prose-td:border-gray-300 prose-td:p-2"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </div>
      </main>

      {/* Article Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-gray-600 mb-2">Enjoyed this article?</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={shareArticle}>
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Share with friends
                  </Button>
                </div>
              </div>

              <div className="text-center md:text-right">
                <p className="text-sm text-gray-500 mb-2">
                  Published on{" "}
                  {article.publishedAt &&
                    new Date(article.publishedAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {article.views.toLocaleString()} views • {readingTime} min
                  read
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

