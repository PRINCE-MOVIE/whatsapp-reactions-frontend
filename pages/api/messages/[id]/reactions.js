const db = require('../../lib/db');

export default async function handler(req, res) {
  await db.init();
  const { id } = req.query;

  if (req.method === 'POST') {
    const { type } = req.body || {};
    if (!type) return res.status(400).json({ error: 'type required' });
    const allowed = ['like', 'love', 'haha', 'fire', 'wow', 'sad'];
    if (!allowed.includes(type)) return res.status(400).json({ error: 'type invalid' });

    try {
      await db.query(`INSERT INTO reactions (message_id, type, user_id) VALUES ($1, $2, $3)`, [Number(id), type, 'anonymous']);
      const rc = await db.query(`SELECT type, COUNT(*)::int as count FROM reactions WHERE message_id = $1 GROUP BY type`, [Number(id)]);
      const counts = {};
      rc.rows.forEach(item => counts[item.type] = Number(item.count));
      return res.status(200).json({ ok: true, reaction_counts: counts });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal_error' });
    }
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
