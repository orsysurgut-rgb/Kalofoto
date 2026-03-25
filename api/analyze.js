export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { base64, mimeType } = req.body;
  if (!base64) return res.status(400).json({ error: 'No image' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: base64 } },
            { type: 'text', text: 'Ты диетолог. Определи блюдо на фото и его КБЖУ. Ответь ТОЛЬКО JSON без markdown:\n{"dish":"название","weight":"вес например 250г","kcal":число,"protein":число,"fat":число,"carbs":число,"note":"совет"}' }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message });

    const text = (data.content || []).map(b => b.text || '').join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Нет JSON в ответе' });

    res.json(JSON.parse(match[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
