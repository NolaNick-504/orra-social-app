import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plain-text password against a bcrypt hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Register a new user with hashed password
 * Returns the created user (without password)
 */
export async function registerUser(
  email: string,
  name: string,
  handle: string,
  password: string
) {
  // Check if email or handle already exists
  const existingUser = await db.user.findFirst({
    where: {
      OR: [{ email }, { handle }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error('Email already registered');
    }
    throw new Error('Handle already taken');
  }

  const hashedPassword = await hashPassword(password);

  const user = await db.user.create({
    data: {
      email,
      name,
      handle,
      password: hashedPassword,
    },
  });

  // Auto-follow the founder (@nickorraceo) — every new user follows the founder
  // This tracks total ORRA community members via the founder's follower count
  try {
    const founder = await db.user.findUnique({ where: { handle: '@nickorraceo' } });
    if (founder && founder.id !== user.id) {
      await db.follow.create({
        data: {
          followerId: user.id,
          followingId: founder.id,
        },
      });
    }
  } catch (followErr) {
    // Non-critical — don't fail signup if auto-follow fails
    console.warn('Auto-follow founder failed:', followErr);
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string) {
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) return null;

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Require authentication for API route handlers
 * Returns { userId, response } — if response is set, return it as 401
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      userId: null,
      session: null,
      response: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  return { userId, session, response: null };
}

/**
 * Get the authenticated user's ID from the session
 * Returns null if not authenticated
 */
export async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as Record<string, unknown>).id as string ?? null;
}

/**
 * Get the authenticated user from the database
 * Returns null if not authenticated
 */
export async function getAuthUser() {
  const userId = await getAuthUserId();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      handle: true,
      avatar: true,
      coverImage: true,
      bio: true,
      location: true,
      website: true,
      verified: true,
      online: true,
      auraTokens: true,
      auraLevel: true,
      auraXP: true,
      dailyStreak: true,
      badges: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Handle API errors consistently
 * Returns a standardized error response
 */
export function handleApiError(error: unknown, message = 'Internal server error') {
  console.error('API Error:', error);
  const errorMessage = error instanceof Error ? error.message : message;
  return NextResponse.json(
    { success: false, error: errorMessage },
    { status: 500 }
  );
}
