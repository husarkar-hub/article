// Assuming this is within a component where you have access to the signOut function
// and potentially useSession hook for conditional rendering.

"use client"; // Required if using hooks like useSession

import React from "react";
import { signOut, useSession } from "next-auth/react"; // Import signOut and useSession
import { Button } from "@/components/ui/button"; // Your Shadcn UI Button component

// Optional: If you want to display the button only when a user is logged in
// import { useRouter } from "next/navigation"; // If you need to redirect after logout

interface LogoutButtonProps {
  // You can add props here if needed, e.g., to customize appearance
}

const Logout: React.FC<LogoutButtonProps> = () => {
  // const router = useRouter(); // Uncomment if you need to redirect after logout
  // const { data: session, status } = useSession(); // Get session data and status

  // // Show loading indicator or nothing if status is 'loading' or session is null
  // if (status === "loading" || !session) {
  //   return null; // Or return a loading spinner component
  // }

  const handleLogout = async () => {
    try {
      // Call signOut.
      // The 'redirect: true' option (default) will redirect to the callbackUrl
      // specified in signOut options or the default signOut page.
      // Set 'redirect: false' if you want to handle redirection manually.
      await signOut({
        redirect: true, // Default is true, redirects to default signout page or callbackUrl
        // callbackUrl: '/sign-in' // Optional: Specify where to redirect after logout
      });
      // If redirect is false:
      // console.log("Successfully signed out.");
      // router.push('/sign-in'); // Redirect manually if redirect option is false
    } catch (error) {
      console.error("Error signing out:", error);
      // Handle error, e.g., show a toast message
    }
  };

  return (
    // This button will only be rendered if the session exists (and status is 'authenticated')
    // if using the useSession check above. Otherwise, it will always be visible.
    <Button
      variant="destructive"
      className="w-full mt-4"
      onClick={handleLogout}
      // Optionally disable while signing out if not redirecting immediately
      // disabled={isSigningOut}
    >
      Logout
    </Button>
  );
};

export default Logout;
