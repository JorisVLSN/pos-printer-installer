export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('API key present:', !!apiKey, 'starts with:', apiKey ? apiKey.substring(0, 7) : 'MISSING');

  try {
    const { messages, system, max_tokens } = req.body;
    console.log('Request body:', JSON.stringify({ messages: messages?.length, system: !!system, max_tokens }));

    const body = {
      model: 'claude-sonnet-4-5',
      max_tokens: max_tokens || 1000,
      system,
      messages,
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Anthropic status:', response.status, 'error:', data.error?.message || 'none');
    res.status(response.status).json(data);
  } catch (e) {
    console.error('Handler error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
