// /netlify/functions/webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { NetlifyBlob } = require('@netlify/blobs');

async function sendConfirmEmail(email) {
  if (!process.env.POSTMARK_TOKEN || !process.env.FROM_EMAIL) return;
  const fetch = (await import('node-fetch')).default;
  const text = `Thank you for registering for Tau Chapter Centennial Homecoming!

Key details:
- Registration: $100 confirmed
- Friday Social Gathering
- Saturday Tailgate (game ticket not included)
- Saturday Night Stepshow at Brown Theater (tickets via Kentucky Performing Arts)

We’ll email any updates. See you soon!`;

  await fetch(process.env.SITE_URL + '/.netlify/functions/send_email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: email, subject: 'Tau Centennial Registration Confirmed', text })
  });
}

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let evt;
  try {
    evt = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed', err.message);
    return { statusCode: 400, body: 'Webhook Error' };
  }

  if (evt.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Ignored' };
  }

  const session = evt.data.object;
  const { name, email, phone, yearJoined, photoUrl, optInPublic } = session.metadata || {};

  try {
    const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
    const key = `registrants/${Date.now()}-${(email || 'unknown').replace(/[^a-z0-9_.-]/gi,'_')}.json`;
    const payload = {
      name,
      email,
      phone,
      yearJoined: Number(yearJoined),
      photoUrl: photoUrl || '',
      optInPublic: optInPublic === '1',
      createdAt: new Date().toISOString()
    };
    await store.set(key, JSON.stringify(payload), { contentType: 'application/json' });

    await sendConfirmEmail(email);
    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    console.error('Blob write failed', e);
    return { statusCode: 500, body: 'Storage error' };
  }
};
