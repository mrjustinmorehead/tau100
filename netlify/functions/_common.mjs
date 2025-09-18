// Shared helpers (ESM) with optional explicit Blobs config via custom env vars
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

// By default, rely on Netlify's automatic context.
// If it fails, you can supply TAU_SITE_ID and TAU_BLOBS_TOKEN in site env to force it.
const blobsOpts = {};
if (process.env.TAU_SITE_ID && process.env.TAU_BLOBS_TOKEN) {
  blobsOpts.siteID = process.env.TAU_SITE_ID;
  blobsOpts.token  = process.env.TAU_BLOBS_TOKEN;
}

export const stores = {
  pending:     () => getStore("pending", blobsOpts),
  registrants: () => getStore("registrants", blobsOpts),
};
