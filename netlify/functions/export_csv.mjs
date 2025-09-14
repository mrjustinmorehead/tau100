import { bad, auth, stores } from "./_common.mjs";

export const handler = async (event) => {
  if (!auth(event)) return bad("Unauthorized", 401);
  const regs = stores.registrants();
  const keys = await regs.list();
  const rows = [
    ["Generated At", new Date().toISOString()].join(","),
    ["Name","Email","Phone","Year","TshirtSize","Package Name","Amount","Verification","Confirmed At","Created At"].join(",")
  ];
  for (const k of keys.blobs) {
    const r = await regs.getJSON(k.key);
    if (!r) continue;
    const line = [
      (r.name||"").replace(/,/g," "),
      (r.email||"").replace(/,/g," "),
      (r.phone||"").replace(/,/g," "),
      r.yearJoined||"",
      r.tshirtSize||"",
      (r.packageName||"").replace(/,/g," "),
      r.packageAmount||"",
      r.verification||"",
      r.confirmedAt||"",
      r.createdAt||""
    ].join(",");
    rows.push(line);
  }
  const body = rows.join("\n");
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=\"registrants.csv\"" },
    body
  };
};
