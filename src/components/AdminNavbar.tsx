"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  Menu,
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import NotificationCenter from "./notifications/NotificationCenter";

const AdminNavbar = () => {
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/admin",
      icon: LayoutDashboard,
      label: "Dashboard",
      description: "Overview & analytics",
    },
    {
      href: "/admin/articles",
      icon: FileText,
      label: "Articles",
      description: "Manage content",
    },
    {
      href: "/admin/categories",
      icon: FolderOpen,
      label: "Categories",
      description: "Organize content",
    },
    {
      href: "/admin/users",
      icon: Users,
      label: "Users",
      description: "User management",
    },
    {
      href: "/admin/settings",
      icon: Settings,
      label: "Settings",
      description: "System configuration",
    },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex items-center gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Menu className="h-4 w-4" />
            <span className="hidden sm:inline">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <div className="bg-primary rounded-lg p-2">
                <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
              </div>
              Admin Panel
            </SheetTitle>
            <SheetDescription>
              Content management system for your blog platform.
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-6" />

          <SheetDescription asChild>
            <div className="space-y-2 px-2 ">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      group flex items-center justify-between p-3 rounded-lg transition-all duration-200 border gap-2
                      ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "border-transparent hover:bg-muted hover:border-border"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                        p-2 rounded-md transition-colors
                        ${
                          isActive
                            ? "bg-primary-foreground/20"
                            : "bg-muted group-hover:bg-muted-foreground/10"
                        }
                      `}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            isActive ? "" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className={`font-medium text-sm ${
                            isActive ? "" : "text-foreground"
                          }`}
                        >
                          {item.label}
                        </div>
                        <div
                          className={`text-xs ${
                            isActive
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${
                        isActive
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </SheetDescription>

          <div className="mt-8 space-y-4">
            <Separator />

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">System Status</span>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Online
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </div>
          </div>

          <SheetFooter className="mt-6 bottom-0 w-full lg:mt-40">
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
};

export default AdminNavbar;
