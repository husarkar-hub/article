// app/sign-in/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react"; // Import signIn
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setIsLoading(false);
      toast.error("Please enter both email and password.");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Signing in...");

    try {
      // Use the signIn function from next-auth/react
      const result = await signIn("credentials", {
        // Pass 'credentials' as the provider name
        redirect: false, // IMPORTANT: Prevent automatic redirect so we can handle errors/success ourselves
        email: email,
        password: password,
      });

      if (result?.error) {
        // Handle authentication errors
        console.error("Login error:", result.error);
        setError(result.error || "Invalid credentials. Please try again."); // Display error from NextAuth
        toast.dismiss(loadingToast);
        toast.error("Login failed", {
          description: result.error || "Invalid credentials. Please try again.",
        });
      } else {
        // Successful login, redirect to the desired page
        console.log("Login successful!");
        toast.dismiss(loadingToast);
        toast.success("Welcome back!", {
          description: "You have been successfully signed in.",
        });
        router.push("/admin");
      }
    } catch (error) {
      // Catch any unexpected client-side errors
      console.error("Unexpected login error:", error);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/95">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto bg-primary rounded-lg p-3 w-fit">
              <div className="h-8 w-8 bg-primary-foreground rounded-sm flex items-center justify-center">
                <span className="font-bold text-primary text-lg">A</span>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Admin Portal
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Sign in to access your content management dashboard
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {/* Display error messages */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm font-medium">
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground border-t pt-6">
            <p>
              Need help accessing your account?{" "}
              <Link
                href="/contact"
                className="text-primary hover:underline font-medium"
              >
                Contact Support
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* System Status */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-card rounded-full px-3 py-1 border">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            System Status: All services operational
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
