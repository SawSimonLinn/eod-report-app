const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

async function callOpenAIChat({ apiKey, systemPrompt, userContent, jsonMode }) {
  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 1,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

module.exports = { callOpenAIChat };
