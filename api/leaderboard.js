import { createClient } from 'redis';

const LEADERBOARD_KEY = 'typing_game_leaderboard';
const RATE_LIMIT_KEY = 'leaderboard_rate_limit';
const MAX_LEADERBOARD_ENTRIES = 10;
const MAX_SCORE = 100000; // Maximum reasonable score
const MIN_SCORE = 0;
const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX_REQUESTS = 10; // max POST requests per window per IP
const RESET_SECRET = process.env.LEADERBOARD_RESET_SECRET || 'change-this-secret-in-production';

// Allowed origins for CORS (comma-separated, or use '*' for all)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['https://kirjoitusnopeuspeli.vercel.app', 'http://localhost:3000', 'http://localhost:3001'];

// Optional API key for additional security (set via environment variable)
const API_KEY = process.env.LEADERBOARD_API_KEY || null;

// Create Redis client - reuse connection across invocations
let redisClient = null;

async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // Get Redis connection URL from environment variables
  // Vercel Redis provides REDIS_URL automatically
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  redisClient = createClient({
    url: redisUrl
  });

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}

// Validate origin
function isValidOrigin(origin) {
  if (!origin) return false;
  
  // Allow all if explicitly set to '*'
  if (ALLOWED_ORIGINS.includes('*')) return true;
  
  // Check if origin matches any allowed origin
  return ALLOWED_ORIGINS.some(allowed => {
    try {
      const originUrl = new URL(origin);
      const allowedUrl = new URL(allowed);
      // Match hostname and protocol
      const hostnameMatch = originUrl.hostname === allowedUrl.hostname;
      const protocolMatch = originUrl.protocol === allowedUrl.protocol;
      // Also check if allowed origin has a port and origin matches it
      if (allowedUrl.port && originUrl.port !== allowedUrl.port) {
        return false;
      }
      return hostnameMatch && protocolMatch;
    } catch {
      // Fallback to exact string match
      return origin === allowed || origin === allowed + '/';
    }
  });
}

// Get origin from request
function getOrigin(req) {
  return req.headers.origin || req.headers.referer?.match(/^https?:\/\/[^/]+/)?.[0] || null;
}

export default async function handler(req, res) {
  const origin = getOrigin(req);
  const isOriginValid = isValidOrigin(origin);
  
  // Set CORS headers based on origin validation
  if (isOriginValid) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (ALLOWED_ORIGINS.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // If origin is not valid, don't set CORS header (blocks CORS requests)
    // But allow same-origin requests
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let redis = null;

  try {
    // Get Redis client
    redis = await getRedisClient();

    if (req.method === 'GET') {
      // Get leaderboard from Redis
      const leaderboardJson = await redis.get(LEADERBOARD_KEY);
      const leaderboard = leaderboardJson ? JSON.parse(leaderboardJson) : [];
      
      // Sort by score descending and return top entries
      const sorted = leaderboard
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_LEADERBOARD_ENTRIES);
      
      res.status(200).json(sorted);
      
    } else if (req.method === 'POST') {
      // Security checks for POST requests
      
      // 1. Origin validation - only allow requests from allowed origins
      if (!isOriginValid && !ALLOWED_ORIGINS.includes('*')) {
        console.warn(`Blocked POST request from invalid origin: ${origin}`);
        return res.status(403).json({ error: 'Pääsy evätty: ei sallittu alkuperä.' });
      }
      
      // 2. API Key validation (if enabled via environment variable)
      // Note: This is optional security layer. Since client-side code is visible,
      // this provides defense-in-depth but isn't foolproof.
      if (API_KEY) {
        const providedKey = req.headers['x-api-key'] || req.body?.apiKey;
        if (!providedKey || providedKey !== API_KEY) {
          console.warn('Blocked POST request: Invalid or missing API key');
          return res.status(403).json({ error: 'Pääsy evätty: virheellinen API-avain.' });
        }
      }
      
      // 3. Rate limiting check
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || 'unknown';
      const rateLimitKey = `${RATE_LIMIT_KEY}:${clientIp}`;
      
      // Check rate limit
      const currentRequests = await redis.get(rateLimitKey) || 0;
      if (parseInt(currentRequests) >= RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({ error: 'Liian monta pyyntöä. Yritä myöhemmin uudelleen.' });
      }
      
      // Increment rate limit counter
      const exists = await redis.exists(rateLimitKey);
      if (!exists) {
        // Key doesn't exist, set it with expiry
        await redis.set(rateLimitKey, '1', { EX: RATE_LIMIT_WINDOW });
      } else {
        await redis.incr(rateLimitKey);
      }
      
      // Add new score to leaderboard
      const { name, score } = req.body;
      
      // Enhanced validation
      if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 20) {
        return res.status(400).json({ error: 'Nimen on oltava 1-20 merkkiä pitkä.' });
      }
      
      // Validate score - must be a number, non-negative, and reasonable
      const scoreNum = typeof score === 'string' ? parseFloat(score) : score;
      if (typeof scoreNum !== 'number' || isNaN(scoreNum) || scoreNum < MIN_SCORE || scoreNum > MAX_SCORE) {
        return res.status(400).json({ error: `Pisteiden on oltava numero välillä ${MIN_SCORE}-${MAX_SCORE}.` });
      }
      
      // Sanitize name (remove potential XSS/injection attempts)
      const sanitizedName = name.trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 20); // Ensure max length
      
      // Get current leaderboard from Redis
      const leaderboardJson = await redis.get(LEADERBOARD_KEY);
      let leaderboard = leaderboardJson ? JSON.parse(leaderboardJson) : [];
      
      // Add new entry
      const newEntry = {
        name: sanitizedName,
        score: Math.floor(scoreNum), // Ensure integer
        date: new Date().toISOString()
      };
      
      leaderboard.push(newEntry);
      
      // Sort by score descending and keep only top entries
      leaderboard = leaderboard
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_LEADERBOARD_ENTRIES);
      
      // Save back to Redis as JSON string
      await redis.set(LEADERBOARD_KEY, JSON.stringify(leaderboard));
      
      res.status(200).json({ success: true, leaderboard });
      
    } else if (req.method === 'DELETE') {
      // Reset leaderboard - requires secret key
      const { secret } = req.body;
      
      if (secret !== RESET_SECRET) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // Delete leaderboard
      await redis.del(LEADERBOARD_KEY);
      
      res.status(200).json({ success: true, message: 'Leaderboard reset successfully' });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Leaderboard API error:', error);
    res.status(500).json({ error: 'Sisäinen palvelinvirhe: ' + error.message });
  }
}
