import crypto from 'crypto';
import fetch from 'node-fetch';
import { NetlifyBlob } from '@netlify/blobs';

function timingSafeEqual(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export const handler = async (event) => {
  try {
    const signature = event.headers['x-square-hmacsha256-signature'] || event.headers['X-Square-Hmacsha256-Signature'];
    const sigKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    if (!sigKey) return { statusCode: 500, body: 'No signature key' };

    const notificationUrl = `${process.env.SITE_URL}/.netlify/functions/square_webhook`;
    const payload = (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body) || '';
    const hmac = crypto.createHmac('sha256', sigKey);
    hmac.update(notificationUrl + payload);
    const expected = hmac.digest('base64');

    if (!signature || !timingSafeEqual(signature, expected)) {
      console.error('Signature mismatch');
      return { statusCode: 401, body: 'Invalid signature' };
    }

    const obj = JSON.parse(payload || '{}');
    const payment = obj?.data?.object?.payment;
    if (!payment) return { statusCode: 200, body: 'Ignored' };
    if (payment.status !== 'COMPLETED') return { statusCode: 200, body: 'Payment not complete' };

    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const orderId = payment.order_id;
    let registrant = null;

    const meta = payment?.metadata || {};
    if (meta?.name || meta?.email) {
      registrant = {
        name: meta.name || '',
        email: meta.email || '',
        phone: meta.phone || '',
        yearJoined: Number(meta.yearJoined || 0),
        tshirtSize: meta.tshirtSize || '',
        photoUrl: meta.photoUrl || '',
        tshirtSize: meta.tshirtSize || '',
        optInPublic: meta.optInPublic === '1',
        createdAt: new Date().toISOString()
      };
    }

    if (!registrant && orderId && accessToken) {
      const oResp = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Square-Version": "2024-08-15"
        }
      });
      if (oResp.ok) {
        const o = await oResp.json();
        const order = o?.order;
        const om = order?.metadata || {};
        registrant = {
          name: om.name || '',
          email: om.email || payment?.buyer_email_address || '',
          phone: om.phone || '',
          yearJoined: Number(om.yearJoined || 0),
          tshirtSize: om.tshirtSize || '',
          photoUrl: om.photoUrl || '',
          tshirtSize: om.tshirtSize || '',
          optInPublic: (om.optInPublic === '1'),
          createdAt: new Date().toISOString()
        };
      }
    }

    if (!registrant) {
      registrant = {
        name: payment?.buyer_details?.name || '',
        email: payment?.buyer_email_address || '',
        phone: payment?.buyer_details?.phone_number || '',
        yearJoined: 0,
        tshirtSize: '',
        photoUrl: '',
        tshirtSize: '',
        optInPublic: true,
        createdAt: new Date().toISOString()
      };
    }

    const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
    const key = `registrants/${Date.now()}-${(registrant.email || 'unknown').replace(/[^a-z0-9_.-]/gi,'_')}.json`;
    await store.set(key, JSON.stringify(registrant), { contentType: 'application/json' });

    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Webhook error' };
  }
};
