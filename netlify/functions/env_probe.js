exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'content-type':'application/json' },
    body: JSON.stringify({
      ok: true,
      env: {
        has_TAU_SITE_ID: !!process.env.TAU_SITE_ID,
        has_TAU_BLOBS_TOKEN: !!process.env.TAU_BLOBS_TOKEN,
        has_NETLIFY_SITE_ID: !!process.env.NETLIFY_SITE_ID,
        has_NETLIFY_BLOBS_TOKEN: !!process.env.NETLIFY_BLOBS_TOKEN,
        node: process.version
      }
    })
  };
};