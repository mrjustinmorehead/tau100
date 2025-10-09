
// _common.cjs — Compatibility wrappers for Netlify Blobs across versions
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
const baseStoreFor = (name) => useExplicit
  ? getStore({ name, siteID: process.env.TAU_SITE_ID, token: process.env.TAU_BLOBS_TOKEN })
  : getStore({ name });

// Wrap store with compatibility helpers (getJSON/setJSON across SDK versions)
const wrapStore = (raw) => {
  // list() may return array of strings or { blobs: [{ key, ... }] }
  const listCompat = async (...args) => {
    const res = await raw.list(...args);
    if (Array.isArray(res)) return { blobs: res.map(key => ({ key })) };
    if (res && Array.isArray(res.blobs)) return res;
    return { blobs: [] };
  };

  const getJsonCompat = async (key) => {
    if (typeof raw.getJSON === "function") return raw.getJSON(key);
    if (typeof raw.get === "function") return raw.get(key, { type: "json" });
    throw new Error("Store get/getJSON not available");
  };

  const setJsonCompat = async (key, val) => {
    if (typeof raw.setJSON === "function") return raw.setJSON(key, val);
    if (typeof raw.set === "function") return raw.set(key, JSON.stringify(val), { contentType: "application/json" });
    throw new Error("Store set/setJSON not available");
  };

  const delCompat = async (key) => {
    if (typeof raw.delete === "function") return raw.delete(key);
    if (typeof raw.remove === "function") return raw.remove(key);
    throw new Error("Store delete/remove not available");
  };

  return {
    list: listCompat,
    getJSON: getJsonCompat,
    setJSON: setJsonCompat,
    delete: delCompat,
    raw,
  };
};

const storeFor = (name) => wrapStore(baseStoreFor(name));

const stores = {
  pending:     () => storeFor("pending"),
  registrants: () => storeFor("registrants"),
};

const blobsMode = () => (useExplicit ? "getStore+opts" : "auto");

module.exports = { json, bad, auth, uid, paymentCode, stores, blobsMode };
