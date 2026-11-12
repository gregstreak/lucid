import { createHmac, timingSafeEqual } from 'node:crypto';

// The longest prompt the server will pass on. The app's real prompt is a few thousand characters.
const MAX_PROMPT_CHARS = 20000;

function readToken(secret, token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const good = createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(good);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims && claims.v === 1 ? claims : null;
  } catch (err) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const tokenSecret = process.env.LUCID_TOKEN_SECRET;
  if (!apiKey || !tokenSecret) {
    return res.status(500).json({ error: 'Analysis is not configured' });
  }

  // Only a device holding a token signed by verify-payment.js or owner-token.js gets through
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!readToken(tokenSecret, token)) {
    return res.status(401).json({ error: 'Analysis is locked on this device. Enter your access code in Settings, or restore your payment.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const prompt = body?.prompt;
    if (typeof prompt !== 'string' || !prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      return res.status(413).json({ error: 'Prompt too long' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const text = data.content?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'No content returned from API' });
    }

    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
