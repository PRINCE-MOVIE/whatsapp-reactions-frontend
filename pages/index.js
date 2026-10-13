import { useEffect, useState } from 'react';

const REACTIONS = [
  { type: 'like', emoji: '👍' },
  { type: 'love', emoji: '❤️' },
  { type: 'haha', emoji: '😂' },
  { type: 'fire', emoji: '🔥' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadMessages() {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 5000);
    return () => clearInterval(t);
  }, []);

  async function react(messageId, type) {
    await fetch(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    loadMessages();
  }

  return (
    <main style={{ maxWidth: 980, margin: '40px auto', fontFamily: 'Arial, sans-serif', padding: 16 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>WhatsApp Channel Reactions</h1>
        <p style={{ color: '#555' }}>Chaque message reçu via WhatsApp est affiché ici. Les visiteurs peuvent réagir sous chaque message.</p>
      </header>

      {loading ? (
        <p>Chargement…</p>
      ) : messages.length === 0 ? (
        <p>Aucun message pour le moment.</p>
      ) : (
        messages.map(msg => {
          const counts = msg.reaction_counts || {};
          return (
            <article key={msg.id} style={{ border: '1px solid #eaeaea', borderRadius: 12, padding: 16, marginBottom: 16, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                <strong>{msg.from_phone}</strong>
                <small style={{ color: '#666' }}>{new Date(msg.created_at).toLocaleString()}</small>
              </div>
              <div style={{ fontSize: 16, marginBottom: 12 }}>{msg.body || '(message multimédia)'}</div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {REACTIONS.map(r => (
                  <button
                    key={r.type}
                    onClick={() => react(msg.id, r.type)}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: 999,
                      padding: '8px 10px',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    {r.emoji} {counts[r.type] || 0}
                  </button>
                ))}
              </div>
            </article>
          );
        })
      )}
    </main>
  );
}
