const { NetlifyBlob } = require('@netlify/blobs');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const contentType = event.headers['content-type'] || '';
  if (!contentType.startsWith('multipart/form-data')) { return { statusCode: 400, body: 'Expected multipart/form-data' }; }
  try {
    const boundary = contentType.split('boundary=')[1];
    const body = Buffer.from(event.body, 'base64');
    const parts = body.toString('binary').split(`--${boundary}`);
    const filePart = parts.find(p => /filename=\".*\"/i.test(p));
    if (!filePart) return { statusCode: 400, body: 'No file found' };
    const match = filePart.match(/filename=\"([^\"]+)\"/i);
    const filename = (match && match[1]) || `photo-${Date.now()}.jpg`;
    const splitIndex = filePart.indexOf('\r\n\r\n');
    const binaryContent = filePart.slice(splitIndex + 4, filePart.lastIndexOf('\r\n'));
    const buf = Buffer.from(binaryContent, 'binary');
    const store = new NetlifyBlob({ siteID: process.env.SITE_ID });
    const key = `photos/${Date.now()}-${filename.replace(/[^a-z0-9_.-]/gi,'_')}`;
    await store.set(key, buf, { contentType: 'image/jpeg' });
    const url = store.getPublicUrl(key);
    return { statusCode: 200, body: JSON.stringify({ url }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: 'Upload failed' };
  }
};
