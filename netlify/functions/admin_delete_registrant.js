const { stores, bad, json } = require("./_common.cjs");
const { requireAdmin } = require("./_admin_auth.cjs");

module.exports.handler = async (event) => {
  if (event.httpMethod !== "POST" && event.httpMethod !== "DELETE") return bad("Method Not Allowed", 405);
  const auth = requireAdmin(event); if (auth) return auth;

  try {
    const { key, softDelete = true, dryRun = false } = JSON.parse(event.body || "{}");
    if (!key) return bad("Missing key", 400);

    const regs = stores.registrants();
    const existing = await regs.getJSON(key).catch(() => null);
    if (!existing) return bad("Not found", 404);

    if (dryRun) return json({ ok:true, dryRun:true, wouldDelete:key });

    if (softDelete) {
      const trashKey = `trash/${Date.now()}__${key}`;
      await regs.setJSON(trashKey, { ...existing, deletedAt:new Date().toISOString() });
    }
    await regs.delete(key);
    return json({ ok:true, deleted:key, softDeleted:!!softDelete });
  } catch (err) {
    return { statusCode:500, headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ ok:false, error:String(err.message || err) }) };
  }
};
