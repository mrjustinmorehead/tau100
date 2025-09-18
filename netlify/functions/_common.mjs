// Shared helpers (ESM) relying on Netlify auto-detected Blobs config
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

export const stores = {
  pending: () => getStore("pending"),
  registrants: () => getStore("registrants"),
};
