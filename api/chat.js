export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { messages, system, max_tokens } = req.body;
    const body = {
      model: 'claude-sonnet-4-5',
      max_tokens: max_tokens || 1000,
      system,
      messages,
    };
    console.log('Calling Anthropic with model:', body.model, 'messages:', messages?.length);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic error:', response.status, JSON.stringify(data));
    }
    res.status(response.status).json(data);
  } catch (e) {
    console.error('Handler error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
