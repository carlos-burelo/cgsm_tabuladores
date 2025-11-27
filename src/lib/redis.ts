import { createClient } from "redis";
import { config } from "./config";
import { logger } from "./logger";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: config.redis.url,
    });

    redisClient.on("error", (err) => logger.error("Redis Client Error", err));
    redisClient.on("connect", () => logger.info("Redis connected"));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error("Failed to connect to Redis", error);
    throw error;
  }
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
