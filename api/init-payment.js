export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Payment configuration error' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);

    const { email, ref } = body;
    if (!email || !ref) {
      return res.status(400).json({ error: 'Missing email or ref' });
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: 14900,
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
    return res.status(500).json({ error: 'Init error: ' + err.message });
  }
}
