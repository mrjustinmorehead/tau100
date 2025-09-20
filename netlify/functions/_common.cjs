
// _common.cjs — Shared helpers (CommonJS) with robust Blobs getStore override
const crypto = require("crypto");
const { getStore } = require("@netlify/blobs");

const json = (body, code=200) => ({
  statusCode: code,
  headers:{ "Content-Type":"application/json" },
  body: JSON.stringify(body)
});
const bad  = (msg="Bad Request", code=400) => ({ statusCode: code, body: msg });
const auth = (event) => {
  const key = event.headers && (event.headers["x-admin-key"] || event.headers["X-Admin-Key"]);
  return !!(process.env.ADMIN_KEY && key && key === process.env.ADMIN_KEY);
};
const uid = () => crypto.randomBytes(6).toString("hex");
const paymentCode = () => "TAU-" + Math.random().toString(36).slice(2,8).toUpperCase();

// Use object-form for getStore for maximum compatibility
const useExplicit = (process.env.TAU_SITE_ID && process.env.TAU_BLOBS_TOKEN);
const storeFor = (name) => useExplicit
  ? getStore({ name, siteID: process.env.TAU_SITE_ID, token: process.env.TAU_BLOBS_TOKEN })
  : getStore({ name });

const stores = {
  pending:     () => storeFor("pending"),
  registrants: () => storeFor("registrants"),
};

const blobsMode = () => (useExplicit ? "getStore+opts" : "auto");

module.exports = { json, bad, auth, uid, paymentCode, stores, blobsMode };
