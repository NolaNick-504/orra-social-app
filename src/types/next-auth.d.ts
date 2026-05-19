import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      handle?: string;
      avatar?: string;
      bio?: string;
      location?: string;
      website?: string;
      auraTokens?: number;
      auraLevel?: number;
      profileSetupComplete?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    handle?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
    auraTokens?: number;
    auraLevel?: number;
    profileSetupComplete?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    handle?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
    auraTokens?: number;
    auraLevel?: number;
    profileSetupComplete?: boolean;
  }
}
