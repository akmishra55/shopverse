
/**
 * Redis is OPTIONAL. If REDIS_URL is missing or Redis is unreachable,
 * the app logs a warning and runs without caching.
 */
const Redis = require('ioredis');

let redis = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    retryStrategy: () => null, // fail fast, never hang a request on cache
  });
  redis.connect().catch(() =>
    console.warn('⚠️  Redis unavailable — continuing WITHOUT caching')
  );
  redis.on('error', () => {});
} else {
  console.warn('⚠️  REDIS_URL not set — product caching disabled');
}

/** Safe cache helpers that never throw. */
const cache = {
  async get(key) {
    try { return redis ? await redis.get(key) : null; } catch { return null; }
  },
  async set(key, value, ttlSec = 300) {
    try { if (redis) await redis.set(key, value, 'EX', ttlSec); } catch {}
  },
  /** Delete every key matching a prefix (used for cache invalidation). */
  async invalidatePrefix(prefix) {
    try {
      if (!redis) return;
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length) await redis.del(keys);
    } catch {}
  },
};

module.exports = { redis, cache };
