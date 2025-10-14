const { stores, bad, json } = require("./_common.cjs");
const { requireAdmin } = require("./_admin_auth.cjs");

module.exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return bad("Method Not Allowed", 405);
  const auth = requireAdmin(event); if (auth) return auth;

  try {
    const { trashKey, newKey, dryRun = false } = JSON.parse(event.body || "{}");
    if (!trashKey || !trashKey.startsWith("trash/")) return bad("Invalid or missing trashKey", 400);

    const regs = stores.registrants();
    const snapshot = await regs.getJSON(trashKey).catch(() => null);
    if (!snapshot) return bad("Trash item not found", 404);

    let restoreKey = newKey && String(newKey).trim();
    if (!restoreKey) {
      const parts = trashKey.split("__");
      restoreKey = parts.length > 1 ? parts.slice(1).join("__") : trashKey.replace(/^trash\//, "");
    }
    if (!restoreKey.startsWith("reg_")) restoreKey = `reg_${restoreKey.replace(/^reg_/, "")}`;

    const existing = await regs.getJSON(restoreKey).catch(() => null);
    if (existing) return bad("A registrant already exists at target key", 409);

    if (dryRun) return json({ ok:true, dryRun:true, wouldRestoreFrom:trashKey, wouldRestoreTo:restoreKey });

    const { deletedAt, deletedBy, ...restored } = snapshot;
    await regs.setJSON(restoreKey, restored);
    await regs.delete(trashKey);

    return json({ ok:true, restoredFrom:trashKey, restoredTo:restoreKey });
  } catch (err) {
    return { statusCode:500, headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ ok:false, error:String(err.message || err) }) };
  }
};
