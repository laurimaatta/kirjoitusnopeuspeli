import { createClient } from 'redis';

const LEADERBOARD_KEY = 'typing_game_leaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
      // Add new score to leaderboard
      const { name, score } = req.body;
      
      // Validation
      if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 20) {
        return res.status(400).json({ error: 'Nimen on oltava 1-20 merkkiä pitkä.' });
      }
      
      if (typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: 'Pisteiden on oltava positiivinen numero.' });
      }
      
      // Get current leaderboard from Redis
      const leaderboardJson = await redis.get(LEADERBOARD_KEY);
      let leaderboard = leaderboardJson ? JSON.parse(leaderboardJson) : [];
      
      // Add new entry
      const newEntry = {
        name: name.trim(),
        score: score,
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
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Leaderboard API error:', error);
    res.status(500).json({ error: 'Sisäinen palvelinvirhe: ' + error.message });
  }
}
