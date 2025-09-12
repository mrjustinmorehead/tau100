const { json, bad, DB } = require('./_common');

exports.handler = async (event) => {
  const token = (event.queryStringParameters && event.queryStringParameters.token) || '';
  if (!token) return bad('Missing token', 400);

  // find pending item by token
  let foundKey = null, item=null;
  for (const k of Object.keys(DB.pending)){
    if(DB.pending[k].token === token){ foundKey=k; item=DB.pending[k]; break; }
  }
  if(!item) return bad('Invalid token', 400);

  // promote to registrants
  delete item.token;
  item.verification = 'self';
  item.confirmedAt = new Date().toISOString();
  const rkey = `reg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  DB.registrants[rkey] = item;
  delete DB.pending[foundKey];

  // redirect to success
  const url = (process.env.SITE_URL || '') + '/?success=1';
  return {
    statusCode: 302,
    headers: { Location: url }
  };
};
