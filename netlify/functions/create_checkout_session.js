// /netlify/functions/create_checkout_session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { name, email, phone, yearJoined, photoUrl, website, optInPublic } = JSON.parse(event.body || '{}');

    // Basic anti-spam & validation
    if (website) return { statusCode: 400, body: 'Spam detected' };
    const y = Number(yearJoined);
    if (!name || !email || !phone || !y || y < 1900 || y > 2100) {
      return { statusCode: 400, body: 'Invalid fields' };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: 10000, // $100.00
          product_data: { name: 'Tau Centennial Registration' },
        },
        quantity: 1,
      }],
      customer_email: email,
      success_url: `${process.env.SITE_URL}/?success=1`,
      cancel_url: `${process.env.SITE_URL}/?canceled=1`,
      metadata: {
        name, email, phone,
        yearJoined: String(y),
        photoUrl: photoUrl || '',
        optInPublic: optInPublic ? '1' : '0'
      },
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Checkout error' };
  }
};
