// app/admin/articles/create/page.tsx

"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // Import useSession

// Import Shadcn UI components
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

import Link from "next/link";

// --- Data Types ---
interface Category {
  id: string;
  name: string;
}

interface CreatedArticle {
  id: string;
  title: string;
  slug: string;
  // ... other fields returned by the API
}

// --- Dummy Data ---
const dummyCategories: Category[] = [
  { id: "cat-1", name: "Technology" },
  { id: "cat-2", name: "Politics" },
  { id: "cat-3", name: "Sports" },
  { id: "cat-4", name: "Entertainment" },
  { id: "cat-5", name: "Health" },
];

// --- Article Creation Form Component ---
const CreateArticleForm = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // --- Form State ---
  const [title, setTitle] = useState("");
  const [slugInput, setSlugInput] = useState(""); // State for the raw slug input
  const [content, setContent] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isBreakingNews, setIsBreakingNews] = useState(false);
  const [isTopRated, setIsTopRated] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [authorId, setAuthorId] = useState<string | null>(null);

  // Set authorId from session when available
  useEffect(() => {
    if (session?.user?.id) {
      setAuthorId(session.user.id);
    }
  }, [session]);

  // --- Derived State for Slug ---
  // Calculate the final slug based on title and slugInput
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
    // Auto-generate slug if the slug input is empty or matches the previously generated slug from title
    if (
      !slugInput.trim() ||
      generateSlug(slugInput.trim()) === generateSlug(title.trim())
    ) {
      setSlugInput(generateSlug(newTitle));
    }
  };

  const handleSlugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugInput(e.target.value); // Update the raw input state
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

    // --- Client-side Validation ---
    const validationErrors: string[] = [];
    if (!title.trim()) validationErrors.push("Article title is required.");
    if (!content.trim()) validationErrors.push("Article content is required.");
    if (!authorId) validationErrors.push("Author information is missing.");
    // Use the derivedSlug for validation
    const finalSlug = derivedSlug; // Use the calculated slug
    if (!finalSlug) validationErrors.push("A valid slug is required.");

    if (validationErrors.length > 0) {
      return;
    }

    // --- Prepare Data for API ---
    const articleData = {
      title: title.trim(),
      slug: finalSlug, // Use the validated and sanitized slug
      content: content.trim(),
      categories: selectedCategories,
      isBreakingNews,
      isTopRated,
      featuredImageUrl: featuredImageUrl.trim() || undefined,
      author: authorId, // Use the authorId from session
    };

    console.log("Submitting article data:", articleData);

    try {
      // --- API Call ---
      const response = await fetch("/api/admin/registerArtical", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articleData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("API Error:", response.status, result);
        throw new Error(
          result.message ||
            `Failed to create article (Status: ${response.status})`
        );
      }

      // Redirect to the articles list page
      router.push("/admin");
    } catch (error: any) {
      console.error("Error submitting article:", error);
    }
  };

  // --- Loading and Unauthenticated States ---

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-sm my-8">
      <CardHeader>
        <CardTitle>Create New Article</CardTitle>
        <CardDescription>
          Fill in the details below to publish a new article.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                value={slugInput} // Use the input state here
                onChange={handleSlugInputChange} // Use the dedicated input handler
                placeholder="e.g., the-future-of-ai"
                required
                className="mt-1"
              />
              {/* Display derived slug if it's different from the raw input */}
              {slugInput.trim() !== derivedSlug && derivedSlug && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sanitized slug: {derivedSlug}
                </p>
              )}
            </div>
          </div>

          {/* Author ID - Pre-filled from session */}
          <div>
            <Label htmlFor="authorId">Author ID</Label>
            <Input
              id="authorId"
              value={authorId || ""}
              readOnly
              required
              className="mt-1 bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Automatically set to your logged-in user ID.
            </p>
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
            {selectedCategories.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Select categories (optional).
              </p>
            )}
          </div>

          {/* Article Properties: Breaking News, Top Rated */}
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
            <Button type="submit" className="px-6 py-2">
              Create Article
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

// Main page component
const CreateArticlePage = () => {
  // Ensure ToastProvider and SessionProvider are set up in your root layout
  return <CreateArticleForm />;
};

export default CreateArticlePage;
