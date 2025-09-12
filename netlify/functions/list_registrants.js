
const { json, stores, listJSON } = require('./_common');
exports.handler = async () => {
  const { registrants } = stores();
  const registrantsList = await listJSON(registrants);
  return json({ registrants: registrantsList });
};
