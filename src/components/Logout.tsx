"use client";

import React, { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

interface LogoutButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
}

const Logout: React.FC<LogoutButtonProps> = ({
  variant = "destructive",
  size = "default",
  className = "",
  showIcon = true,
}) => {
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Don't show the button if not authenticated
  if (status === "loading" || !session) {
    return null;
  }

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await signOut({
        redirect: true,
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      disabled={isSigningOut}
    >
      {isSigningOut ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        showIcon && <LogOut className="h-4 w-4 mr-2" />
      )}
      {isSigningOut ? "Signing out..." : "Logout"}
    </Button>
  );
};

export default Logout;
