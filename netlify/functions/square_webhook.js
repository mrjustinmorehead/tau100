import crypto from 'crypto';
import fetch from 'node-fetch';
import { NetlifyBlob } from '@netlify/blobs';

function timingSafeEqual(a,b){ const A=Buffer.from(a); const B=Buffer.from(b); if(A.length!==B.length) return false; return crypto.timingSafeEqual(A,B); }

export const handler = async (event) => {
  try {
    const signature = event.headers['x-square-hmacsha256-signature'] || event.headers['X-Square-Hmacsha256-Signature'];
    const sigKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    if (!sigKey) return { statusCode: 500, body: 'No signature key' };

    const notificationUrl = `${process.env.SITE_URL}/.netlify/functions/square_webhook`;
    const payload = (event.isBase64Encoded ? Buffer.from(event.body,'base64').toString('utf8') : event.body) || '';
    const hmac = crypto.createHmac('sha256', sigKey); hmac.update(notificationUrl + payload);
    const expected = hmac.digest('base64');
    if (!signature || !timingSafeEqual(signature, expected)) return { statusCode: 401, body: 'Invalid signature' };

    const obj = JSON.parse(payload || '{}');
    const payment = obj?.data?.object?.payment;
    if (!payment) return { statusCode: 200, body: 'Ignored' };
    if (payment.status !== 'COMPLETED') return { statusCode: 200, body: 'Payment not complete' };

    // Build registrant
    const meta = payment?.metadata || {};
    let registrant = {
      name: meta.name || '', email: meta.email || payment?.buyer_email_address || '',
      phone: meta.phone || '', yearJoined: Number(meta.yearJoined || 0),
      tshirtSize: meta.tshirtSize || '', photoUrl: meta.photoUrl || '',
      optInPublic: meta.optInPublic === '1', createdAt: new Date().toISOString(),
      audit: { amount: payment?.amount_money?.amount || null, currency: payment?.amount_money?.currency || 'USD', payment_id: payment?.id || '', created: payment?.created_at || null }
    };

    const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
    const key = `registrants/${Date.now()}-${(registrant.email || 'unknown').replace(/[^a-z0-9_.-]/gi,'_')}.json`;
    await store.set(key, JSON.stringify(registrant), { contentType: 'application/json' });

    return { statusCode: 200, body: 'OK' };
  } catch (e) { console.error(e); return { statusCode: 500, body: 'Webhook error' }; }
};