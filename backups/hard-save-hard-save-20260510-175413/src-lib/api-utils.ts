import { NextResponse } from 'next/server';

/**
 * Standardized API error response helper.
 * Ensures all API routes return consistent { success, error } format
 * and never leak internal error details to the client.
 */

export interface ApiErrorOptions {
  status?: number;
  logMessage?: string;
}

const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request',
  401: 'Authentication required',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  429: 'Too many requests',
  500: 'Internal server error',
};

/**
 * Create a standardized error response.
 * Never exposes raw error.message to the client — use `logMessage` for server logs.
 */
export function apiError(
  error: string,
  options: ApiErrorOptions = {}
): NextResponse {
  const { status = 400, logMessage } = options;

  if (logMessage) {
    console.error(`[API ${status}] ${logMessage}`);
  }

  return NextResponse.json(
    { success: false, error },
    { status }
  );
}

/**
 * Safely parse request JSON with proper error handling.
 * Returns { data, error } — if error is set, return apiError(error, { status: 400 }).
 */
export async function safeParseJson(
  request: Request
): Promise<{ data: Record<string, unknown> | null; error: NextResponse | null }> {
  try {
    const data = await request.json();
    return { data, error: null };
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Catch-all error handler for API route catch blocks.
 * Logs the real error server-side but returns a generic message to the client.
 * This prevents leaking stack traces, SQL errors, or internal details.
 */
export function handleApiError(
  error: unknown,
  context: string
): NextResponse {
  // Log the full error server-side for debugging
  console.error(`[${context}]`, error);

  // Check for specific Prisma errors that should have different status codes
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };

    switch (prismaError.code) {
      case 'P2002':
        // Unique constraint violation
        const target = prismaError.meta?.target?.[0] || 'field';
        return NextResponse.json(
          { success: false, error: `A record with this ${target} already exists` },
          { status: 409 }
        );
      case 'P2025':
        // Record not found
        return NextResponse.json(
          { success: false, error: 'Record not found' },
          { status: 404 }
        );
      case 'P2003':
        // Foreign key constraint
        return NextResponse.json(
          { success: false, error: 'Referenced record not found' },
          { status: 400 }
        );
    }
  }

  // Default: return generic error, never expose internals
  return NextResponse.json(
    { success: false, error: DEFAULT_ERROR_MESSAGES[500] },
    { status: 500 }
  );
}

/**
 * Safely parse a JSON string with fallback.
 * Returns fallback if parsing fails (prevents crashes on corrupt data).
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}
