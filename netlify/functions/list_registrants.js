const { json, DB } = require('./_common');

exports.handler = async () => {
  const registrants = Object.keys(DB.registrants).map(k => DB.registrants[k]);
  return json({ registrants });
};
