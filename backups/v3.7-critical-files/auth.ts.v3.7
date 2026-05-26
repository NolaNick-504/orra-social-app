import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  // Trust the Host header from Caddy reverse proxy
  // This allows NextAuth to work correctly behind the proxy
  // by using the actual domain from the browser request
  // Note: trustHost is supported in next-auth v4.24.x but not in TS types yet
  ...( { trustHost: true } as Partial<NextAuthOptions> ),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'you@orra.app',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null; // Return null instead of throwing for cleaner error handling
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            return null; // No account found
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            return null; // Wrong password
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            handle: user.handle,
            avatar: user.avatar,
            bio: user.bio,
            location: user.location,
            website: user.website,
            auraTokens: user.auraTokens,
            auraLevel: user.auraLevel,
            profileSetupComplete: user.profileSetupComplete,
          };
        } catch (error) {
          console.error('Auth authorize error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in — add custom fields to token
      if (user) {
        token.id = user.id;
        token.handle = user.handle;
        token.avatar = user.avatar;
        token.bio = user.bio;
        token.location = user.location;
        token.website = user.website;
        token.auraTokens = user.auraTokens;
        token.auraLevel = user.auraLevel;
        token.profileSetupComplete = user.profileSetupComplete;
      }

      // Refresh token data from DB when client calls update() (e.g. after profile change)
      // This ensures avatar/handle changes are reflected in the session
      if (trigger === 'update') {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: {
              handle: true,
              avatar: true,
              bio: true,
              location: true,
              website: true,
              auraTokens: true,
              auraLevel: true,
              profileSetupComplete: true,
            },
          });
          if (dbUser) {
            token.handle = dbUser.handle;
            token.avatar = dbUser.avatar;
            token.bio = dbUser.bio;
            token.location = dbUser.location;
            token.website = dbUser.website;
            token.auraTokens = dbUser.auraTokens;
            token.auraLevel = dbUser.auraLevel;
            token.profileSetupComplete = dbUser.profileSetupComplete;
          }
        } catch {
          // If DB lookup fails, keep existing token data
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Pass custom fields from token to session
      if (session.user) {
        session.user.id = token.id;
        session.user.handle = token.handle;
        session.user.avatar = token.avatar;
        session.user.bio = token.bio;
        session.user.location = token.location;
        session.user.website = token.website;
        session.user.auraTokens = token.auraTokens;
        session.user.auraLevel = token.auraLevel;
        session.user.profileSetupComplete = token.profileSetupComplete;
      }
      return session;
    },
  },
  pages: {
    signIn: '/', // We'll handle sign-in on the main page
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
