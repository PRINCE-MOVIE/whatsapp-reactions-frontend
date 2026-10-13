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
  const [channelId, setChannelId] = useState('');
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');

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
    const saved = typeof window !== 'undefined' ? localStorage.getItem('channelId') : null;
    if (saved) {
      setChannelId(saved);
      setInput(saved);
    }
    loadMessages();
    const t = setInterval(loadMessages, 5000);
    return () => clearInterval(t);
  }, []);

  function saveChannel() {
    if (!input) return setStatus('Colle l\'ID du numéro de téléphone de ta chaîne.');
    localStorage.setItem('channelId', input);
    setChannelId(input);
    setStatus('Connecté à la chaîne : ' + input);
  }

  async function react(messageId, type) {
    await fetch(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    loadMessages();
  }

  const visible = channelId ? messages.filter(m => m.channel_id === channelId) : messages;

  return (
    <main style={{ maxWidth: 980, margin: '40px auto', fontFamily: 'Arial, sans-serif', padding: 16 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>WhatsApp Channel Reactions</h1>
        <p style={{ color: '#555' }}>Connecte ta chaîne et chaque message envoyé obtiendra automatiquement des réactions.</p>
      </header>

      <section style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Colle ici l'ID du numéro de téléphone (phone_number_id)"
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
          />
          <button onClick={saveChannel} style={{ padding: '8px 12px', borderRadius: 8, background: '#2d6df6', color: '#fff', border: 'none' }}>Connecter</button>
          <button onClick={() => { localStorage.removeItem('channelId'); setChannelId(''); setInput(''); setStatus('Déconnecté'); }} style={{ padding: '8px 12px', borderRadius: 8 }}>Déconnecter</button>
        </div>
        <div style={{ marginTop: 8, color: '#666' }}>{status || (channelId ? ('Connecté : ' + channelId) : 'Aucune chaîne configurée')}</div>
        <div style={{ marginTop: 10, color: '#666' }}>Tu peux trouver le phone_number_id dans la console Meta (WhatsApp Cloud API) → il apparaît dans les webhooks sous metadata.phone_number_id.</div>
      </section>

      <section>
        {loading ? (
          <p>Chargement…</p>
        ) : visible.length === 0 ? (
          <p>Aucun message pour le moment{channelId ? ' (pour la chaîne sélectionnée)' : ''}.</p>
        ) : (
          visible.map(msg => {
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
      </section>
    </main>
  );
}
