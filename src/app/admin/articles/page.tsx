"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// Import UI components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import icons
import { MoreVertical, Edit, Plus, Search } from "lucide-react";

import Link from "next/link";

// --- Data Types ---
interface Category {
  id: string;
  name: string;
  _count?: {
    articles: number;
  };
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

// --- Article Creation Form Component ---
export const CreateArticleForm = () => {
  const router = useRouter();
  const { data: session } = useSession();

  // --- Form State ---
  const [title, setTitle] = useState("");
  const [slugInput, setSlugInput] = useState(""); // State for the raw slug input
  const [content, setContent] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isBreakingNews, setIsBreakingNews] = useState(false);
  const [isTopRated, setIsTopRated] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [authorId, setAuthorId] = useState<string | null>(null);

  // --- Categories State ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

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
      toast.error("Validation Error", {
        description: validationErrors.join(" "),
      });
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

    // Show loading toast
    const loadingToast = toast.loading("Creating article...");

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
        toast.dismiss(loadingToast);
        toast.error("Failed to create article", {
          description: result.message || `Error: ${response.status}`,
        });
        throw new Error(
          result.message ||
            `Failed to create article (Status: ${response.status})`
        );
      }

      toast.dismiss(loadingToast);
      toast.success("Article created successfully!", {
        description: `"${title}" has been published to your site.`,
      });

      // Redirect to the articles list page
      router.push("/admin");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create article";
      console.error("Error submitting article:", errorMessage);

      toast.dismiss(loadingToast);
      toast.error("Creation failed", {
        description: errorMessage,
      });
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
            <div className="flex items-center justify-between">
              <Label>Categories</Label>
              <Link
                href="/admin/categories"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Manage Categories
              </Link>
            </div>
            {categoriesLoading ? (
              <div className="mt-1 p-4 text-center text-muted-foreground">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="mt-1 p-4 text-center text-muted-foreground">
                No categories available.{" "}
                <Link
                  href="/admin/categories"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Create categories first
                </Link>
                .
              </div>
            ) : (
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {categories.map((cat) => (
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
            )}
            {selectedCategories.length === 0 && !categoriesLoading && (
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

// Articles Page Component
const ArticlesPage = () => {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Ensure search input is only interactive on client-side
  useEffect(() => {
    // This ensures the search functionality only works on the client
    // which prevents hydration mismatches
    const searchInput = document.querySelector(
      'input[placeholder="Search articles..."]'
    );
    if (searchInput) {
      searchInput.addEventListener("focus", () => {
        // This is just to ensure we're client-side when focusing
      });
    }
  }, []);
  const [loading, setLoading] = useState(true);

  // Fetch articles
  useEffect(() => {
    // Only fetch articles on the client side
    if (typeof window !== "undefined") {
      const fetchData = () => {
        fetchArticles();
      };

      // Add a small delay to ensure proper hydration
      const timer = setTimeout(fetchData, 10);

      return () => clearTimeout(timer);
    }
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch("/api/admin/articles");
      if (!response.ok) {
        toast.error("Failed to load articles", {
          description: "Unable to retrieve articles from the server.",
        });
        throw new Error("Failed to fetch articles");
      }
      const data = await response.json();
      setArticles(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setLoading(false);
      toast.error("Loading failed", {
        description: "Could not load articles. Please refresh the page.",
      });
    }
  };

  // Delete article - not currently used in UI
  // const handleDelete = async (id: string) => {
  //   if (typeof window !== "undefined") {
  //     if (!window.confirm("Are you sure you want to delete this article?"))
  //       return;
  //   }

  //   try {
  //     const response = await fetch(`/api/admin/articles/${id}/delete`, {
  //       method: "DELETE",
  //     });

  //     if (!response.ok) throw new Error("Failed to delete article");
  //     fetchArticles();
  //   } catch (error) {
  //     console.error("Error deleting article:", error);
  //   }
  // };

  // Change article status - not currently used in UI
  // const handleStatusChange = async (id: string, newStatus: string) => {
  //   try {
  //     const response = await fetch(`/api/admin/articles/${id}/status`, {
  //       method: "PUT",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ status: newStatus }),
  //     });

  //     if (!response.ok) throw new Error("Failed to update article status");
  //     fetchArticles();
  //   } catch (error) {
  //     console.error("Error updating article status:", error);
  //   }
  // };

  // Filter articles based on search term
  const filteredArticles = React.useMemo(() => {
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.author &&
          article.author.name &&
          article.author.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        article.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [articles, searchTerm]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Button
          onClick={() => {
            // Ensure routing only happens on client-side
            if (typeof window !== "undefined") {
              router.push("/admin/articles/create");
            }
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Article
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Articles Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableCaption>A list of all articles.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading articles...
                  </TableCell>
                </TableRow>
              ) : filteredArticles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No articles found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>{article.title || "Untitled"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          article.status === "PUBLISHED"
                            ? "default"
                            : article.status === "DRAFT"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {(article.status || "unknown").toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{article.author?.name || "Unknown"}</TableCell>
                    <TableCell>
                      {article.createdAt
                        ? new Date(article.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      {article.views || 0}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              // Ensure routing only happens on client-side
                              if (typeof window !== "undefined") {
                                router.push(
                                  `/admin/articles/edit/${article.id}`
                                );
                              }
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {/* Delete functionality temporarily disabled */}
                          {/* <DropdownMenuItem
                            onClick={() => handleDelete(article.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem> */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticlesPage;
