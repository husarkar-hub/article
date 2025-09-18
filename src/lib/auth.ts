import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';


import { db } from './db';



export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt', // Using JWT for session management
  },
  pages: {
    signIn: '/sign-in', // Custom sign-in page
  },
  secret: process.env.NEXTAUTH_SECRET || 'DEFAULT_SECRET_FOR_DEV', // Use a strong secret in production!
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', required: true },
        password: { label: 'Password', type: 'password', required: true },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          // Return null for invalid credentials. NextAuth handles the error message.
          return null;
        }

        const { email, password } = credentials;

       
        const user = await db.user.findUnique({
          where: { email: email as string },
          
        });
       
       
        if (!user || !user.hashedPassword) {
          return null;
        }

        const matchpasword:boolean=password===user.hashedPassword
       
        if(  matchpasword===false ){

            return null;
        }

       

        // IMPORTANT: Return only necessary data for the JWT.
        // Do NOT return hashedPassword. PrismaAdapter will map this to the User object.
        // Ensure all returned properties match what your next-auth.d.ts expects in JWT/Session.
        return {
          id: user.id,
          email: user.email,
          // Generate username if missing
          role: user.role, // This should be the string representation of your enum

        };
      },
    }),
    // Add other providers like GoogleProvider, GitHubProvider here if needed
  ],
  callbacks: {
    // This callback is called every time a JWT is created or updated.
    async jwt({ token, user, trigger, session }: { token: any; user?: any; trigger?: string; session?: any }) {
      // console.log('JWT Callback:', { token, user, trigger, session });

      // --- Update token if session is updated from client ---
      // This is used when you call useSession().update()
      if (trigger === "update" && session?.role) {
        token.role = session.role;
        // Update other fields if they are part of the update payload
        // token.username = session.username;
        // token.hasAccess = session.hasAccess;
        return token;
      }
      // --- End update handling ---

      // If `user` is present, it means the user just signed in (via authorize or OAuth).
      // Populate the token with the user data returned from authorize/provider.
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.username = user.username; // Already set by authorize
        token.role = user.role;         // Already set by authorize
        token.hasAccess = user.hasAccess; // Already set by authorize
      }
      // If `user` is NOT present, it means the JWT is being refreshed.
      // Ensure the token has up-to-date info from the database, especially if roles can change.
      // This block might be redundant if your user data doesn't change often after login,
      // but it's good for robustness.
      else if (token.email && !token.id) { // Check if token has email but not ID (might happen sometimes)
          const dbUser = await db.user.findUnique({
            where: { email: token.email as string },
            select: { // Select only necessary fields
              id: true,
            
              email: true,
            
           
            }
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.email = dbUser.email;
           
          } else {
            // User not found in DB during refresh - token is likely stale/invalid.
            console.error("User not found in DB during JWT refresh:", token.email);
            // Returning an empty object effectively invalidates the token.
            return {};
          }
      }
      // The final token object is returned and will be encrypted.
      return token;
    },

    // This callback is called when a session is created (e.g., on initial page load).
    // It receives the JWT and populates the session object.
    async session({ session, token }) {
      // console.log('Session Callback:', { session, token });

      // Check if token exists and populate session.user with data from the token.
      // TypeScript should know about token.id, token.email, token.role, etc. from your next-auth.d.ts.
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
       
        session.user.role = token.role as string;       // Expected to be string from enum
   
      }
      // Return the session object. This is what useSession() returns on the client.
      return session;
    },

   redirect({ baseUrl }: { baseUrl: string }) {
      // You can customize redirects here. For now, return to base URL.
      return baseUrl;
    },
  },
};

// Helper function to get the session server-side
export const getAuthSession = () => getServerSession(authOptions);