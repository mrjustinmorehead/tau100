// Shared helpers using createClient fallback; written as ESBuild-friendly JS
import crypto from "crypto";
import { getStore, createClient } from "@netlify/blobs";

export const json = (body, code=200) => ({ statusCode: code, headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
export const bad = (msg="Bad Request", code=400) => ({ statusCode: code, body: msg });
export const auth = (event) => {
  const key = event.headers["x-admin-key"] || event.headers["X-Admin-Key"];
  return !!(process.env.ADMIN_KEY && key && key === process.env.ADMIN_KEY);
};
export const uid = () => crypto.randomBytes(6).toString("hex");
export const paymentCode = () => "TAU-" + Math.random().toString(36).slice(2,8).toUpperCase();

let client = null;
let mode = "auto";

if (process.env.TAU_SITE_ID && process.env.TAU_BLOBS_TOKEN) {
  client = createClient({ siteID: process.env.TAU_SITE_ID, token: process.env.TAU_BLOBS_TOKEN });
  mode = "client";
}

const storeFor = (name) => client ? client.getStore(name) : getStore(name);

export const stores = {
  pending:     () => storeFor("pending"),
  registrants: () => storeFor("registrants"),
};

export const blobsMode = () => mode;
