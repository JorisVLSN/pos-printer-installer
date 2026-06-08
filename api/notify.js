export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { property, status, issue, resolution, steps_taken } = req.body;

  const statusLabel = status === 'onboarding' ? '🟡 Being set up' : status === 'live' ? '🟢 Live' : '⚪ Unknown';
  const resLabel = resolution === 'resolved' ? '✅ Resolved' : resolution === 'escalated' ? '🔺 Escalated' : '⚠️ Unresolved';
  const steps = (steps_taken || []).map(s => `• ${s}`).join('\n') || 'None';
  const time = new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });

  const text = `🖨️ Printer Support Session

Property: ${property || 'Unknown'}
Status: ${statusLabel}
Issue: ${issue || 'Not specified'}
Resolution: ${resLabel}
Steps taken:
${steps}

${time}`;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mews Printer Bot <onboarding@resend.dev>',
        to: 'tmp-ai-experiments-aaaaurwmqz7nbit65ejikmz7v4@mews.slack.com',
        subject: `Printer Support – ${property || 'Unknown property'}`,
        text,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(500).json({ error: err });
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
