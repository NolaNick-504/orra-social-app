import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaReady: Promise<void> | undefined
}

// ALWAYS use global singleton — even in production.
// Without this, hot-reloads or module re-imports create extra PrismaClients
// that each hold a SQLite connection, leading to SQLITE_BUSY errors.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

// Store singleton globally — always, not just in development
globalForPrisma.prisma = db

// Await PRAGMA statements to prevent race conditions.
// Fire-and-forget PRAGMAs can cause queries to run before WAL mode
// or busy_timeout are set, leading to SQLITE_BUSY errors.
export const dbReady = globalForPrisma.prismaReady ?? (async () => {
  try {
    await db.$queryRawUnsafe('PRAGMA journal_mode=WAL')
    await db.$queryRawUnsafe('PRAGMA busy_timeout=30000')
    await db.$queryRawUnsafe('PRAGMA synchronous=NORMAL')
    await db.$queryRawUnsafe('PRAGMA cache_size=-64000')
    await db.$queryRawUnsafe('PRAGMA temp_store=MEMORY')
  } catch {
    // PRAGMA errors are non-fatal — the DB still works with defaults
  }
})()
globalForPrisma.prismaReady = dbReady

// Default transaction options - increased timeouts for concurrent write scenarios
export const transactionOptions = {
  maxWait: 15000,
  timeout: 30000,
  isolationLevel: undefined as any,
}

/**
 * Write serialization queue for SQLite
 * 
 * SQLite in WAL mode allows concurrent reads but serializes writes.
 * When many concurrent write transactions arrive, they compete for the
 * single write lock, causing timeouts and P1008/P2028 errors.
 * 
 * This queue serializes write transactions at the application level,
 * preventing lock contention and ensuring predictable behavior.
 */
class WriteQueue {
  private queue: (() => Promise<any>)[] = []
  private processing = false

  async run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (err) {
          reject(err)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const task = this.queue.shift()!
      await task()
    }

    this.processing = false
  }
}

export const writeQueue = new WriteQueue()

/**
 * Award XP and tokens to a user with proper level-up handling.
 * XP resets at 1000 and level increments each time it crosses the threshold.
 * Returns the updated auraLevel and auraXP.
 */
export async function awardXPAndTokens(
  userId: string,
  tokensAmount: number,
  xpAmount: number
): Promise<{ auraLevel: number; auraXP: number; auraTokens: number; levelUps: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { auraLevel: true, auraXP: true, auraTokens: true },
  });
  if (!user) throw new Error('User not found');

  let newXP = user.auraXP + xpAmount;
  let newLevel = user.auraLevel;
  let levelUps = 0;

  // Handle multiple level-ups if XP crosses 1000 more than once
  while (newXP >= 1000) {
    newXP -= 1000;
    newLevel += 1;
    levelUps++;
  }

  const newTokens = user.auraTokens + tokensAmount;

  await db.user.update({
    where: { id: userId },
    data: {
      auraLevel: newLevel,
      auraXP: newXP,
      auraTokens: newTokens,
    },
  });

  return { auraLevel: newLevel, auraXP: newXP, auraTokens: newTokens, levelUps };
}

/**
 * Execute a write transaction in a serialized queue.
 * This prevents SQLite write lock contention by ensuring only one
 * write transaction runs at a time.
 */
export async function serializedTransaction<T>(
  fn: (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => Promise<T>,
  options?: { maxWait?: number; timeout?: number }
): Promise<T> {
  return writeQueue.run(async () => {
    return db.$transaction(fn, {
      maxWait: options?.maxWait ?? transactionOptions.maxWait,
      timeout: options?.timeout ?? transactionOptions.timeout,
    })
  })
}
