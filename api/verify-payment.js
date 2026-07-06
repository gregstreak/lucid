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

    const { reference } = body;
    if (!reference) {
      return res.status(400).json({ error: 'No payment reference provided' });
    }

    // Verify the transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment not successful', details: data.message });
    }

    // Payment confirmed — generate a simple unlock token
    const unlockToken = `lucid_${data.data.reference}_${Date.now()}`;

    return res.status(200).json({
      success: true,
      token: unlockToken,
      amount: data.data.amount,
      email: data.data.customer.email
    });

  } catch (err) {
    return res.status(500).json({ error: 'Verification error: ' + err.message });
  }
}
