const db = require('../lib/db');

export default async function handler(req, res) {
  await db.init();

  // Verification for Meta webhook
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || '';

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
      }
      return res.status(403).end();
    }
    return res.status(400).end();
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (!body || body.object !== 'whatsapp_business_account') {
        return res.status(200).send('ignored');
      }

      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value || {};
          const messages = value.messages || [];
          for (const msg of messages) {
            const from = msg.from;
            const whatsappId = msg.id;
            let text = null;
            let media = null;
            if (msg.type === 'text' && msg.text && msg.text.body) {
              text = msg.text.body;
            } else if (msg.type === 'image' && msg.image) {
              text = msg.caption || null;
              media = msg.image.id || null;
            } else {
              text = JSON.stringify(msg).slice(0, 1000);
            }

            const channelId = value.metadata?.phone_number_id || 'default';

            // Insert or get message id
            const insert = `INSERT INTO messages (whatsapp_message_id, from_phone, body, media_url, channel_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (whatsapp_message_id) DO UPDATE SET body = EXCLUDED.body RETURNING id`;
            const r = await db.query(insert, [whatsappId, from, text, media, channelId]);
            let messageId = r.rows[0] && r.rows[0].id;
            if (!messageId) {
              const sel = await db.query(`SELECT id FROM messages WHERE whatsapp_message_id = $1`, [whatsappId]);
              messageId = sel.rows[0] && sel.rows[0].id;
            }

            if (messageId) {
              // add automatic reactions
              const defaults = ['like', 'love', 'fire'];
              for (const t of defaults) {
                try {
                  await db.query(`INSERT INTO reactions (message_id, type, user_id) VALUES ($1,$2,$3)`, [messageId, t, 'auto']);
                } catch (e) {
                  // ignore duplicate or other errors
                }
              }
            }
          }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
      console.error('webhook error', err);
      return res.status(500).json({ error: 'internal_error' });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).end('Method Not Allowed');
}
