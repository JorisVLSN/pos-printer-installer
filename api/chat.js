export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, system, max_tokens } = req.body;

  // Try each provider in order until one succeeds
  const providers = [
    () => callAnthropic(messages, system, max_tokens),
    () => callFastrouter(messages, system, max_tokens),
    () => callKimi(messages, system, max_tokens),
    () => callGemini(messages, system, max_tokens),
  ];

  for (const provider of providers) {
    try {
      const text = await provider();
      if (text) return res.status(200).json({ content: [{ text }] });
    } catch (e) {
      console.warn('Provider failed, trying next:', e.message);
    }
  }

  res.status(500).json({ error: 'All providers failed' });
}

async function callAnthropic(messages, system, max_tokens) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: max_tokens || 1000, system, messages }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error('Anthropic ' + response.status + ': ' + (data.error?.message || JSON.stringify(data)));
  return data.content?.[0]?.text;
}

async function callFastrouter(messages, system, max_tokens) {
  const allMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;
  const response = await fetch('https://api.fastrouter.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.FASTROUTER_API_KEY,
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: max_tokens || 1000, messages: allMessages }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error('Fastrouter ' + response.status + ': ' + (data.error?.message || JSON.stringify(data)));
  return data.choices?.[0]?.message?.content;
}

async function callKimi(messages, system, max_tokens) {
  const allMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.KIMI_API_KEY,
    },
    body: JSON.stringify({ model: 'moonshot-v1-8k', max_tokens: max_tokens || 1000, messages: allMessages }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error('Kimi ' + response.status + ': ' + (data.error?.message || JSON.stringify(data)));
  return data.choices?.[0]?.message?.content;
}

async function callGemini(messages, system, max_tokens) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const body = { contents };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  if (max_tokens) body.generationConfig = { maxOutputTokens: max_tokens };

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error('Gemini ' + response.status + ': ' + (data.error?.message || JSON.stringify(data)));
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}
