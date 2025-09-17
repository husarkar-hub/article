// next-auth.d.ts
import { DefaultSession, DefaultJWT } from "next-auth";
import { JWT } from "next-auth/jwt"; // Import JWT type for clarity

// Extend the built-in Session and User types
declare module "next-auth" {
  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback.
   */
  interface User extends DefaultUser { // Extend DefaultUser to keep default props like email, name, image
    id: string; // Ensure ID is present
    username?: string | null;
    role: string; // This is the role from your DB enum, often represented as a string in JS/TS
   
    // Add any other custom fields from your Prisma User model
  }

  /**
   * The shape of the session object.
   */
  interface Session {
    user: {
      id: string;
      username?: string | null;
      role: string;
  
      // ...other properties you want available in the session object
    } & DefaultSession["user"]; // Keep default properties like name, email, image
  }
}

// Extend the built-in JWT type
declare module "next-auth/jwt" {
  /**
   * Returned by the `jwt` callback and `getToken`, when using JWT sessions.
   */
  interface JWT extends DefaultJWT { // Extend DefaultJWT to keep default props like name, email, picture
    id: string;
    username?: string | null;
    role: string;
  
    // ...other properties you want to store in the JWT
  }
}