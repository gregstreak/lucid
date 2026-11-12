const REF_FORMAT = /^lucid_\d{10,16}_[a-z0-9]{1,12}$/;
const DEFAULT_CENTS = 14900;

// The price lives on the server. LUCID_PRICE_CENTS can lower it for an R10 test; it is
// ignored unless it is a whole number of cents between R10 and R500.
function priceCents() {
  const n = Number(process.env.LUCID_PRICE_CENTS);
  return Number.isInteger(n) && n >= 1000 && n <= 50000 ? n : DEFAULT_CENTS;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Payment configuration error' });
  }

  let email, ref;
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    ({ email, ref } = body || {});
  } catch (err) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Missing or invalid email' });
  }
  if (typeof ref !== 'string' || !REF_FORMAT.test(ref)) {
    return res.status(400).json({ error: 'Invalid payment reference' });
  }

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: priceCents(),
        currency: 'ZAR',
        reference: ref,
        callback_url: 'https://lucid.signalandseed.co.za',
        metadata: {
          custom_fields: [
            { display_name: 'Product', variable_name: 'product', value: 'Lucid AI analysis lifetime unlock' }
          ]
        }
      })
    });

    const data = await response.json();

    if (!data.status || !data.data?.authorization_url) {
      return res.status(400).json({ error: 'Could not initialize payment', details: data.message });
    }

    return res.status(200).json({ url: data.data.authorization_url });

  } catch (err) {
    return res.status(500).json({ error: 'Init error' });
  }
}
