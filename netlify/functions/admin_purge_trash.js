const { stores, bad, json } = require("./_common.cjs");
const { requireAdmin } = require("./_admin_auth.cjs");

module.exports.handler = async (event) => {
  if (event.httpMethod !== "POST" && event.httpMethod !== "DELETE") return bad("Method Not Allowed", 405);
  const auth = requireAdmin(event); if (auth) return auth;

  try {
    const { trashKey, dryRun = false } = JSON.parse(event.body || "{}");
    if (!trashKey || !trashKey.startsWith("trash/")) return bad("Invalid or missing trashKey", 400);

    const regs = stores.registrants();
    const exists = await regs.getJSON(trashKey).catch(() => null);
    if (!exists) return bad("Not found", 404);

    if (dryRun) return json({ ok:true, dryRun:true, wouldPurge:trashKey });

    await regs.delete(trashKey);
    return json({ ok:true, purged:trashKey });
  } catch (err) {
    return { statusCode:500, headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ ok:false, error:String(err.message || err) }) };
  }
};
