import { createHmac } from 'node:crypto';

// A reference made by Lucid looks like lucid_1731400000000_ab12cd. Anything else is refused,
// which also stops payments made for other products from unlocking Lucid.
const REF_FORMAT = /^lucid_\d{10,16}_[a-z0-9]{1,12}$/;
// init-payment.js fixes the real price on the server. This floor only has to be low enough
// to let an R10 test payment through (see LUCID_PRICE_CENTS).
const MIN_CENTS = 1000;

function makeToken(secret, claims) {
  const payload = Buffer.from(JSON.stringify({ v: 1, ...claims, iat: Date.now() })).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return payload + '.' + sig;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const tokenSecret = process.env.LUCID_TOKEN_SECRET;
  if (!secretKey || !tokenSecret) {
    return res.status(500).json({ error: 'Payment configuration error' });
  }

  let reference;
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    reference = body && body.reference;
  } catch (err) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  if (typeof reference !== 'string' || !REF_FORMAT.test(reference)) {
    return res.status(400).json({ error: 'Invalid payment reference' });
  }

  try {
    // Ask Paystack whether this payment really happened
    const response = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    const tx = data && data.data;

    if (!data || !data.status || !tx || tx.status !== 'success') {
      return res.status(400).json({ error: 'Payment not successful', details: data && data.message });
    }
    if (tx.reference !== reference || tx.currency !== 'ZAR' || !Number.isInteger(tx.amount) || tx.amount < MIN_CENTS) {
      return res.status(400).json({ error: 'Payment does not match this product' });
    }

    // Payment confirmed: hand back a signed unlock token. analyse.js checks the signature.
    return res.status(200).json({
      success: true,
      token: makeToken(tokenSecret, { t: 'paid', r: reference })
    });

  } catch (err) {
    return res.status(500).json({ error: 'Verification error' });
  }
}
