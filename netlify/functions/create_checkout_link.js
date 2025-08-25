import fetch from 'node-fetch';
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { name, email, phone, yearJoined, tshirtSize, photoUrl, website, optInPublic } = JSON.parse(event.body || '{}');
    if (website) return { statusCode: 400, body: 'Spam detected' };
    const y = Number(yearJoined);
    if (!name || !email || !phone || !y || y < 1900 || y > 2100) return { statusCode: 400, body: 'Invalid fields' };

    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!accessToken || !locationId) return { statusCode: 500, body: 'Square not configured' };

    const redirectUrl = `${process.env.SITE_URL}/?success=1`;
    const body = {
      idempotency_key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      description: "Tau Centennial Registration",
      quick_pay: { name: "Tau Centennial Registration", price_money: { amount: 10000, currency: "USD" }, location_id: locationId },
      checkout_options: { redirect_url: redirectUrl, ask_for_shipping_address: false, allow_tipping: false },
      pre_populated_data: { buyer_email: email, buyer_phone_number: phone },
      metadata: { name, email, phone, yearJoined: String(y), tshirtSize: tshirtSize || "", photoUrl: photoUrl || "", optInPublic: optInPublic ? "1" : "0" }
    };

    const resp = await fetch("https://connect.squareup.com/v2/online-checkout/payment-links", {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json", "Square-Version": "2024-08-15" },
      body: JSON.stringify(body)
    });
    if (!resp.ok) { const t = await resp.text(); console.error("Square error:", t); return { statusCode: 500, body: 'Square link error' }; }
    const data = await resp.json();
    const url = data?.payment_link?.url;
    if (!url) return { statusCode: 500, body: 'No payment link returned' };
    return { statusCode: 200, body: JSON.stringify({ url }) };
  } catch (err) { console.error(err); return { statusCode: 500, body: 'Server error' }; }
};