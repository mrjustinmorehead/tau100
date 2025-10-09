import { json, stores, uid, blobsMode } from "./_common.mjs";

export const handler = async () => {
  const attemptKey = `diag_${Date.now()}_${uid()}`;
  let wrote = false, readBack = null, error = null;
  try {
    const s = stores.pending();
    await s.setJSON(attemptKey, { hello: "world", t: new Date().toISOString() });
    wrote = true;
    readBack = await s.getJSON(attemptKey);
  } catch (e) {
    error = e?.message || String(e);
  }
  return json({
    ok: wrote && !!readBack,
    wrote,
    readBack,
    error,
    mode: blobsMode(),
    env: {
      hasTauSiteId: !!process.env.TAU_SITE_ID,
      hasTauBlobsToken: !!process.env.TAU_BLOBS_TOKEN,
      node: process.version
    }
  });
};
