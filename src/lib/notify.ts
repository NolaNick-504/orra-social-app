import { db } from '@/lib/db';

/**
 * Extract @mentions from text and create notifications for mentioned users.
 * Mentions are in the format @handle (e.g., @johndoe).
 * Only creates notifications for real users, and skips the author mentioning themselves.
 */
export async function notifyMentions(
  text: string,
  authorId: string,
  thumbnail: string = '',
  postId?: string
): Promise<void> {
  try {
    // Extract @handles from text (alphanumeric + underscores, 2-30 chars)
    const mentionRegex = /@([a-zA-Z0-9_]{2,30})/g;
    const handles: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      handles.push(match[1]);
    }

    if (handles.length === 0) return;

    // Deduplicate handles
    const uniqueHandles = [...new Set(handles)];

    // Look up users by handle
    const mentionedUsers = await db.user.findMany({
      where: {
        handle: { in: uniqueHandles },
        id: { not: authorId }, // Don't notify self
      },
      select: { id: true, name: true, handle: true },
    });

    if (mentionedUsers.length === 0) return;

    // Get author name for the notification
    const author = await db.user.findUnique({
      where: { id: authorId },
      select: { name: true },
    });

    // Create a notification for each mentioned user
    await Promise.all(
      mentionedUsers.map((user) =>
        db.notification.create({
          data: {
            userId: user.id,
            action: `${author?.name || 'Someone'} mentioned you in a post`,
            type: 'mention',
            thumbnail,
            triggeredByUserId: authorId,
            postId: postId || null,
          },
        })
      )
    );
  } catch {
    // Mention notification creation is best-effort
  }
}

/**
 * Create a notification for a user. Safe to call from any API route.
 */
export async function createNotification(params: {
  userId: string;
  action: string;
  type: string;
  thumbnail?: string;
  triggeredByUserId: string;
  postId?: string;
}): Promise<void> {
  try {
    await db.notification.create({ data: params });
  } catch {
    // Best-effort
  }
}
