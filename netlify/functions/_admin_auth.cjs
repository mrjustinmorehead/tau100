// Shared-secret auth helper
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
function requireAdmin(event) {
  const provided = event.headers["x-admin-key"] || event.headers["X-Admin-Key"] || "";
  if (!ADMIN_SECRET || provided !== ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ ok:false, error:"unauthorized" }) };
  }
  return null;
}
module.exports = { requireAdmin };
