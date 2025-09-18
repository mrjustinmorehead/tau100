
// Shared helpers (CommonJS) with createClient fallback for Blobs
const crypto = require("crypto");
const { getStore, createClient } = require("@netlify/blobs");

const json = (body, code=200) => ({ statusCode: code, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
const bad  = (msg="Bad Request", code=400) => ({ statusCode: code, body: msg });
const auth = (event) => {
  const key = event.headers["x-admin-key"] || event.headers["X-Admin-Key"];
  return !!(process.env.ADMIN_KEY && key && key === process.env.ADMIN_KEY);
};
const uid = () => crypto.randomBytes(6).toString("hex");
const paymentCode = () => "TAU-" + Math.random().toString(36).slice(2,8).toUpperCase();

let client = null;
let mode = "auto";

if (process.env.TAU_SITE_ID && process.env.TAU_BLOBS_TOKEN) {
  client = createClient({ siteID: process.env.TAU_SITE_ID, token: process.env.TAU_BLOBS_TOKEN });
  mode = "client";
}

const storeFor = (name) => client ? client.getStore(name) : getStore(name);

const stores = {
  pending:     () => storeFor("pending"),
  registrants: () => storeFor("registrants"),
};

const blobsMode = () => mode;

module.exports = { json, bad, auth, uid, paymentCode, stores, blobsMode };
