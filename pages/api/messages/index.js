const db = require('../lib/db');

export default async function handler(req, res) {
  await db.init();

  if (req.method === 'GET') {
    try {
      const q = await db.query(`SELECT * FROM messages ORDER BY created_at DESC`);
      const rows = [];
      for (const msg of q.rows) {
        const rc = await db.query(`SELECT type, COUNT(*)::int as count FROM reactions WHERE message_id = $1 GROUP BY type`, [msg.id]);
        const counts = {};
        rc.rows.forEach(item => counts[item.type] = Number(item.count));
        rows.push({ ...msg, reaction_counts: counts });
      }
      return res.status(200).json(rows);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal_error' });
    }
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
