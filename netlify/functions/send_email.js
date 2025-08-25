// /netlify/functions/send_email.js
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const { to, subject, text } = JSON.parse(event.body || '{}');
  if (!process.env.POSTMARK_TOKEN || !process.env.FROM_EMAIL) return { statusCode: 200, body: 'Email not configured' };
  await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: { 'X-Postmark-Server-Token': process.env.POSTMARK_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ From: process.env.FROM_EMAIL, To: to, Subject: subject, TextBody: text })
  });
  return { statusCode: 200, body: 'Sent' };
};
