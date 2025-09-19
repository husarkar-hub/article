"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

// Import UI components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

// --- Data Types ---
interface Category {
  id: string;
  name: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  author: {
    name: string;
    id: string;
  };
  createdAt: string;
  views: number;
  categories: Category[];
  isBreakingNews: boolean;
  isTopRated: boolean;
  featuredImageUrl?: string;
}

// --- Dummy Data ---
const dummyCategories: Category[] = [
  { id: "cat-1", name: "Technology" },
  { id: "cat-2", name: "Politics" },
  { id: "cat-3", name: "Sports" },
  { id: "cat-4", name: "Entertainment" },
  { id: "cat-5", name: "Health" },
];

// --- Edit Article Page Component ---
const EditArticlePage = () => {
  const router = useRouter();
  const params = useParams();
  const { data: _session, status: _status } = useSession();
  const articleId = params.id as string;

  // --- Form State ---
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isBreakingNews, setIsBreakingNews] = useState(false);
  const [isTopRated, setIsTopRated] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [currentStatus, setCurrentStatus] = useState<
    "DRAFT" | "PUBLISHED" | "ARCHIVED"
  >("DRAFT");
  const [error, setError] = useState("");

  // Fetch article data
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        // Only fetch on client side
        if (typeof window === "undefined") {
          return;
        }

        const response = await fetch(`/api/admin/articles/${articleId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch article");
        }
        const data = await response.json();
        setArticle(data);

        // Populate form state
        setTitle(data.title || "");
        setSlugInput(data.slug || "");
        setContent(data.content || "");
        setIsBreakingNews(!!data.isBreakingNews);
        setIsTopRated(!!data.isTopRated);
        setFeaturedImageUrl(data.featuredImageUrl || "");
        setCurrentStatus(data.status || "DRAFT");

        // Set categories if available
        if (data.categories && Array.isArray(data.categories)) {
          setSelectedCategories(data.categories.map((cat: Category) => cat.id));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching article:", error);
        setError("Failed to load article. Please try again.");
        setLoading(false);
      }
    };

    if (articleId && typeof window !== "undefined") {
      // Small delay to ensure hydration completes
      const timer = setTimeout(() => {
        fetchArticle();
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [articleId]); // --- Derived State for Slug ---
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  const derivedSlug = slugInput.trim() || generateSlug(title.trim());

  // --- Event Handlers ---
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Auto-update slug if it was derived from title
    if (
      !slugInput.trim() ||
      generateSlug(slugInput.trim()) === generateSlug(title.trim())
    ) {
      setSlugInput(generateSlug(newTitle));
    }
  };

  const handleSlugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugInput(e.target.value);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure we're only running this on the client
    if (typeof window === "undefined") {
      return;
    }

    setError("");

    // --- Client-side Validation ---
    if (!title.trim()) {
      setError("Article title is required.");
      return;
    }
    if (!content.trim()) {
      setError("Article content is required.");
      return;
    }
    if (!derivedSlug) {
      setError("A valid slug is required.");
      return;
    }

    // --- Prepare Data for API ---
    const articleData = {
      id: articleId,
      title: title.trim(),
      slug: derivedSlug,
      content: content.trim(),
      categories: selectedCategories,
      isBreakingNews,
      isTopRated,
      featuredImageUrl: featuredImageUrl.trim() || null,
      status: currentStatus,
    };

    try {
      // --- API Call ---
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to update article (Status: ${response.status})`
        );
      }

      // Redirect to articles list after successful update
      if (typeof window !== "undefined") {
        router.push("/admin/articles");
      }
    } catch (error: any) {
      console.error("Error updating article:", error);
      setError(error.message || "Failed to update article");
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p>Loading article...</p>
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
        <Button
          className="mt-4"
          onClick={() => {
            // Ensure routing only happens on client-side
            if (typeof window !== "undefined") {
              router.push("/admin/articles");
            }
          }}
        >
          Back to Articles
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-sm my-8">
      <CardHeader>
        <CardTitle>Edit Article</CardTitle>
        <CardDescription>Update the article details below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Title and Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Article Title</Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g., The Future of AI"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="slug">Article Slug (URL friendly)</Label>
              <Input
                id="slug"
                value={slugInput}
                onChange={handleSlugInputChange}
                placeholder="e.g., the-future-of-ai"
                required
                className="mt-1"
              />
              {slugInput.trim() !== derivedSlug && derivedSlug && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sanitized slug: {derivedSlug}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Article Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setContent(e.target.value)
              }
              placeholder="Write your article here..."
              rows={15}
              required
              className="mt-1 min-h-[300px]"
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Article Status</Label>
            <div className="flex space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="status-draft"
                  checked={currentStatus === "DRAFT"}
                  onChange={() => setCurrentStatus("DRAFT")}
                  className="h-4 w-4"
                />
                <Label htmlFor="status-draft" className="font-normal">
                  Draft
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="status-published"
                  checked={currentStatus === "PUBLISHED"}
                  onChange={() => setCurrentStatus("PUBLISHED")}
                  className="h-4 w-4"
                />
                <Label htmlFor="status-published" className="font-normal">
                  Published
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="status-archived"
                  checked={currentStatus === "ARCHIVED"}
                  onChange={() => setCurrentStatus("ARCHIVED")}
                  className="h-4 w-4"
                />
                <Label htmlFor="status-archived" className="font-normal">
                  Archived
                </Label>
              </div>
            </div>
          </div>

          {/* Featured Image URL */}
          <div>
            <Label htmlFor="featuredImageUrl">Featured Image URL</Label>
            <Input
              id="featuredImageUrl"
              type="url"
              value={featuredImageUrl}
              onChange={(e) => setFeaturedImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="mt-1"
            />
          </div>

          {/* Categories Selection */}
          <div>
            <Label>Categories</Label>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {dummyCategories.map((cat) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={cat.id}
                    checked={selectedCategories.includes(cat.id)}
                    onCheckedChange={() => handleCategoryToggle(cat.id)}
                  />
                  <Label htmlFor={cat.id} className="font-normal">
                    {cat.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Article Properties */}
          <div className="flex flex-wrap items-center space-x-4 md:space-x-8">
            <div className="flex items-center space-x-2">
              <Switch
                id="breaking-news"
                checked={isBreakingNews}
                onCheckedChange={setIsBreakingNews}
              />
              <Label htmlFor="breaking-news">Breaking News</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="top-rated"
                checked={isTopRated}
                onCheckedChange={setIsTopRated}
              />
              <Label htmlFor="top-rated">Top Rated</Label>
            </div>
          </div>

          {/* Submit Button */}
          <CardFooter className="flex justify-end pt-6 px-0">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Ensure routing only happens on client-side
                  if (typeof window !== "undefined") {
                    router.push("/admin/articles");
                  }
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="px-6 py-2">
                Update Article
              </Button>
            </div>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditArticlePage;
