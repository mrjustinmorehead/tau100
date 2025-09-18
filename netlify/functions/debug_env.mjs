import { json, stores, uid } from "./_common.mjs";

export const handler = async (event) => {
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
    env: {
      // helpful, but not leaking secrets
      hasTauSiteId: !!process.env.TAU_SITE_ID,
      hasTauBlobsToken: !!process.env.TAU_BLOBS_TOKEN,
      node: process.version
    }
  });
};
