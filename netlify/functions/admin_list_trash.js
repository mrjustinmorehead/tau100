const { stores, bad } = require("./_common.cjs");
const { requireAdmin } = require("./_admin_auth.cjs");

module.exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return bad("Method Not Allowed", 405);
  const auth = requireAdmin(event); if (auth) return auth;

  try {
    const regs = stores.registrants();
    let listed;
    try { listed = await regs.list(); } catch { listed = []; }
    const arr = Array.isArray(listed?.blobs) ? listed.blobs : (Array.isArray(listed) ? listed : []);

    const results = [];
    for (const entry of arr) {
      const key = typeof entry === "string" ? entry : (entry && (entry.key || entry.id));
      if (!key || !key.startsWith("trash/")) continue;

      let data = null;
      try { data = await regs.getJSON(key); } catch { data = null; }

      results.push({
        key,
        name: data?.name || "",
        email: data?.email || "",
        packageName: data?.packageName || "",
        deletedAt: data?.deletedAt || null,
        createdAt: data?.createdAt || null
      });
    }

    return { statusCode:200, headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ ok:true, items: results.sort((a,b)=> (a.key < b.key ? 1 : -1)) }) };
  } catch (err) {
    return { statusCode:500, headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ ok:false, error:String(err.message || err) }) };
  }
};
