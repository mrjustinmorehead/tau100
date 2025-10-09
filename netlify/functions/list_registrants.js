
const { json, stores } = require("./_common.cjs");
module.exports.handler = async () => {
  const regs = stores.registrants();
  const keys = await regs.list();
  const registrants = [];
  for (const k of keys.blobs) {
    const j = await regs.getJSON(k.key);
    if (j) registrants.push(j);
  }
  registrants.sort((a,b)=> new Date(b.confirmedAt||b.createdAt||0) - new Date(a.confirmedAt||a.createdAt||0));
  return json({ registrants });
};
