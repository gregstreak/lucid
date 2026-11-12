import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

function makeToken(secret, claims) {
  const payload = Buffer.from(JSON.stringify({ v: 1, ...claims, iat: Date.now() })).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return payload + '.' + sig;
}

// Swaps the owner's private access code (LUCID_OWNER_CODE in Vercel) for the same kind of
// signed token a paying customer gets. With no code configured, nothing is accepted.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.LUCID_OWNER_CODE;
  const tokenSecret = process.env.LUCID_TOKEN_SECRET;
  if (!expected || expected.length < 16 || !tokenSecret) {
    return res.status(500).json({ error: 'Access codes are not set up' });
  }

  let code;
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    code = body && body.code;
  } catch (err) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  if (typeof code !== 'string' || !code || code.length > 200) {
    return res.status(400).json({ error: 'Enter your access code' });
  }

  // Hash both sides so the comparison takes the same time whatever is typed
  const a = createHash('sha256').update(code).digest();
  const b = createHash('sha256').update(expected).digest();
  if (!timingSafeEqual(a, b)) {
    await new Promise(resolve => setTimeout(resolve, 600));   // slows guessing
    return res.status(401).json({ error: 'That code did not work' });
  }

  return res.status(200).json({ success: true, token: makeToken(tokenSecret, { t: 'owner' }) });
}
