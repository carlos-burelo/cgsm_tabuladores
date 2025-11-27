import { db } from "../db";
import { logger } from "../logger";
import { v4 as uuid } from "uuid";

const IDEMPOTENCY_KEY_TTL_HOURS = 24;

interface IdempotencyResult {
  exists: boolean;
  result?: Record<string, unknown>;
}

export class IdempotencyService {
  async checkAndStore(
    key: string,
    instanceId: string,
    result: Record<string, unknown>
  ): Promise<IdempotencyResult> {
    try {
      const existing = await db.idempotencyKey.findUnique({
        where: { key },
      });

      if (existing) {
        return {
          exists: true,
          result: existing.result as Record<string, unknown>,
        };
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_KEY_TTL_HOURS);

      await db.idempotencyKey.create({
        data: {
          key,
          instanceId,
          result,
          expiresAt,
        },
      });

      return { exists: false };
    } catch (error) {
      logger.error("Idempotency check failed", error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      const result = await db.idempotencyKey.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Cleaned up ${result.count} expired idempotency keys`);
    } catch (error) {
      logger.error("Idempotency cleanup failed", error);
    }
  }
}

export const idempotencyService = new IdempotencyService();
