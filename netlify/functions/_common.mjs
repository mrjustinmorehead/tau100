// Shared helpers (ESM) with explicit Blobs options when running outside managed context
import crypto from "crypto";
import { getStore } from "@netlify/blobs";

export const json = (body, code=200) => ({ statusCode: code, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
export const bad = (msg="Bad Request", code=400) => ({ statusCode: code, body: msg });
export const auth = (event) => {
  const key = event.headers["x-admin-key"] || event.headers["X-Admin-Key"];
  return !!(process.env.ADMIN_KEY && key && key === process.env.ADMIN_KEY);
};
export const uid = () => crypto.randomBytes(6).toString("hex");
export const paymentCode = () => "TAU-" + Math.random().toString(36).slice(2,8).toUpperCase();

// Blobs options: when running on Netlify prod, SDK auto-detects site & token.
// If not auto-detected (as your error indicates), pass them explicitly via env.
const blobsOpts = {};
if (process.env.SITE_ID && process.env.NETLIFY_API_TOKEN) {
  blobsOpts.siteID = process.env.SITE_ID;
  blobsOpts.token = process.env.NETLIFY_API_TOKEN;
}

export const stores = {
  pending: () => getStore("pending", blobsOpts),
  registrants: () => getStore("registrants", blobsOpts),
};
