"use client";

import AdminNavbar from "@/components/AdminNavbar";
import React, { Suspense, useEffect } from "react";
import NextAuthSessionProvider from "@/components/NextAuthSessionProvider";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import CurrentDateTime from "@/components/healperComp/CurrentDateTime";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, Wifi, Clock } from "lucide-react";

// SEO Component for Admin Pages
const AdminSEOHead = () => {
  useEffect(() => {
    // Set dynamic title for admin pages
    document.title = "Admin Dashboard - Content Management System";

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      "content",
      "Secure admin dashboard for content management, article publishing, user management, and analytics. Professional CMS interface."
    );

    // Add robots meta for admin pages (prevent indexing)
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute("content", "noindex, nofollow");

    // Add viewport meta if not exists
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement("meta");
      viewportMeta.setAttribute("name", "viewport");
      viewportMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1"
      );
      document.head.appendChild(viewportMeta);
    }
  }, []);

  return null;
};

const WeatherDisplay = () => {
  const weatherData = {
    temperature: "25°C",
    description: "Sunny",
    city: "Your City",
  };
  return (
    <Card className="hidden md:flex lg:flex items-center gap-3 text-sm p-3 bg-muted/50 border-none">
      <div className="flex items-center gap-2">
        <Cloud className="h-4 w-4 text-blue-500" />
        <span className="font-medium">{weatherData.city}:</span>
        <span className="text-muted-foreground">{weatherData.temperature}</span>
        <Badge variant="outline" className="text-xs">
          {weatherData.description}
        </Badge>
      </div>
    </Card>
  );
};

const SystemStatus = () => {
  return (
    <Card className="hidden xl:flex items-center gap-2 text-sm p-3 bg-green-50 border-green-200">
      <Wifi className="h-4 w-4 text-green-600" />
      <span className="text-green-700 font-medium">System Online</span>
      <Badge
        variant="outline"
        className="bg-green-100 text-green-700 border-green-300"
      >
        99.9% Uptime
      </Badge>
    </Card>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextAuthSessionProvider>
      <NotificationProvider>
        <AdminSEOHead />
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                {/* Left side - Navigation */}
                <div className="flex items-center gap-4">
                  <AdminNavbar />
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-semibold text-foreground">
                      Admin Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Content Management System
                    </p>
                  </div>
                </div>

                {/* Right side - Status & Time */}
                <div className="flex items-center space-x-3">
                  <Suspense
                    fallback={
                      <Card className="animate-pulse h-12 w-48 bg-muted"></Card>
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <CurrentDateTime />
                    </div>
                  </Suspense>
                  <WeatherDisplay />
                  <SystemStatus />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="min-h-[calc(100vh-80px)]">{children}</main>

          {/* Footer */}
          <footer className="border-t bg-muted/30 py-6 mt-12">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  © 2024 Article Management System. All rights reserved.
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Version 1.0.0</span>
                  <Badge variant="outline" className="text-xs">
                    Production
                  </Badge>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </NotificationProvider>
    </NextAuthSessionProvider>
  );
};

export default AdminLayout;
