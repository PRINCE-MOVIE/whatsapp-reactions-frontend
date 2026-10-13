const db = require('../../../lib/db');

export default async function handler(req, res) {
  await db.init();

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const messagesRes = await db.query(`SELECT * FROM messages ORDER BY created_at DESC`);
    const messages = messagesRes.rows;

    const results = [];
    for (const m of messages) {
      const rc = await db.query(`SELECT type, COUNT(*)::int as count FROM reactions WHERE message_id = $1 GROUP BY type`, [m.id]);
      const counts = {};
      rc.rows.forEach(r => counts[r.type] = r.count);
      results.push({ ...m, reaction_counts: counts });
    }

    res.json(results);
  } catch (err) {
    console.error('messages error', err);
    res.status(500).json({ error: 'internal_error' });
  }
}
