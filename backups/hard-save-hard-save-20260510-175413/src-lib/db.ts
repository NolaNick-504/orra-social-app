import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Enable WAL mode for better concurrent read/write performance
// Use $queryRawUnsafe since PRAGMA statements return result sets
db.$queryRawUnsafe('PRAGMA journal_mode=WAL').catch(() => {})
db.$queryRawUnsafe('PRAGMA busy_timeout=30000').catch(() => {})
db.$queryRawUnsafe('PRAGMA synchronous=NORMAL').catch(() => {})
db.$queryRawUnsafe('PRAGMA cache_size=-64000').catch(() => {})
db.$queryRawUnsafe('PRAGMA temp_store=MEMORY').catch(() => {})

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
