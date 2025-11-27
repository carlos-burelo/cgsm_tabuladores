import Redlock from "redlock";
import { getRedisClient } from "../redis";
import { logger } from "../logger";

const LOCK_TTL = 30000;
const LOCK_RETRY_COUNT = 10;
const LOCK_RETRY_DELAY = 100;

let redlock: Redlock | null = null;

async function getRedlock(): Promise<Redlock> {
  if (!redlock) {
    const client = await getRedisClient();
    redlock = new Redlock([client], {
      driftFactor: 0.01,
      retryCount: LOCK_RETRY_COUNT,
      retryDelay: LOCK_RETRY_DELAY,
      retryJitter: 200,
    });
  }
  return redlock;
}

export class LockService {
  async acquireLock(key: string, callback: () => Promise<void>): Promise<void> {
    const lockKey = `lock:${key}`;
    const locker = await getRedlock();

    let lock;
    try {
      lock = await locker.lock(lockKey, LOCK_TTL);
      logger.debug(`Lock acquired: ${lockKey}`);

      try {
        await callback();
      } finally {
        await lock.unlock().catch((error) => {
          logger.warn(`Failed to unlock ${lockKey}`, error);
        });
        logger.debug(`Lock released: ${lockKey}`);
      }
    } catch (error) {
      logger.error(`Failed to acquire lock ${lockKey}`, error);
      throw error;
    }
  }
}

export const lockService = new LockService();
