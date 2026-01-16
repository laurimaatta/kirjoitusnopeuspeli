import { kv } from '@vercel/kv';

const LEADERBOARD_KEY = 'typing_game_leaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get leaderboard
      const leaderboard = await kv.get(LEADERBOARD_KEY) || [];
      
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
      
      // Get current leaderboard
      let leaderboard = await kv.get(LEADERBOARD_KEY) || [];
      
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
      
      // Save back to KV
      await kv.set(LEADERBOARD_KEY, leaderboard);
      
      res.status(200).json({ success: true, leaderboard });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Leaderboard API error:', error);
    res.status(500).json({ error: 'Sisäinen palvelinvirhe' });
  }
}
