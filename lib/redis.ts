import { Redis } from "@upstash/redis";

const RESPONSES_KEY = "birthday35:responses";

let client: Redis | null | undefined;

export function isRedisConfigured(): boolean {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && token);
}

export function getRedis(): Redis | null {
  if (client !== undefined) return client;

  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    client = null;
    return null;
  }

  client = new Redis({ url, token });
  return client;
}

export async function redisGetResponses<T>(): Promise<T[] | null> {
  const redis = getRedis();
  if (!redis) return null;
  const data = await redis.get<T[]>(RESPONSES_KEY);
  return data ?? [];
}

export async function redisSetResponses<T>(responses: T[]): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis is not configured");
  }
  await redis.set(RESPONSES_KEY, responses);
}
