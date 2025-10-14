const { stores } = require("./_common.cjs");
const { requireAdmin } = require("./_admin_auth.cjs");

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

module.exports.handler = async (event) => {
  const auth = requireAdmin(event); if (auth) return auth;

  try {
    const regs = stores.registrants();
    let listed;
    try { listed = await regs.list(); } catch { listed = []; }
    const arr = Array.isArray(listed?.blobs) ? listed.blobs : (Array.isArray(listed) ? listed : []);

    const rows = [];
    const header = [
      "key","name","email","phone","packageName","packageAmount","yearJoined","tshirtSize","createdAt","confirmedAt"
    ];
    rows.push(header.join(","));

    for (const entry of arr) {
      const key = typeof entry === "string" ? entry : (entry && (entry.key || entry.id));
      if (!key || key.startsWith("trash/")) continue;

      let data = null;
      try { data = await regs.getJSON(key); } catch { data = null; }
      const line = [
        csvEscape(key),
        csvEscape(data?.name || ""),
        csvEscape(data?.email || ""),
        csvEscape(data?.phone || ""),
        csvEscape(data?.packageName || ""),
        csvEscape(data?.packageAmount || 0),
        csvEscape(data?.yearJoined || ""),
        csvEscape(data?.tshirtSize || ""),
        csvEscape(data?.createdAt || ""),
        csvEscape(data?.confirmedAt || "")
      ].join(",");
      rows.push(line);
    }

    const csv = rows.join("\r\n");
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=registrants.csv",
        "Cache-Control": "no-store"
      },
      body: csv
    };
  } catch (err) {
    return { statusCode:500, headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ ok:false, error:String(err.message || err) }) };
  }
};
